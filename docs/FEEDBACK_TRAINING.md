# Using the 👍/👎 feedback to improve the models (bonus proposal)

This is a proposal, not something the app does today. It starts from the data the app already stores,
then describes how that data would become better recommendations and a better AI insight, how we would
know it worked, and what it would take to do safely.

The short version: **every vote is already stored as a training example (who, in what context, saw what,
and liked it or not).** We would start cheaply (better prompts and simple re-ranking), measure with an A/B
test, and only fine-tune a model once there are enough votes to justify it.

---

## 1. What we already collect

Two tables matter (`server/prisma/schema.prisma`).

**`Feedback`**: one row per user per item they voted on. Voting again updates the same row
(`@@unique([userId, section, itemId])`), and clicking the same thumb again deletes it.

| Column | Meaning |
|---|---|
| `section` | `NEWS`, `PRICES`, `INSIGHT` or `MEME` |
| `itemId` | Stable id of the item: the news id, the CoinGecko coin id, the `DailyInsight` id, the meme id |
| `vote` | `+1` or `-1` (the label) |
| `contentSnapshot` | JSON: exactly what the user saw, their preferences at that moment, and when they voted |
| `createdAt` / `updatedAt` | First vote and last change (a changed mind is a signal too) |

We store a **snapshot** and not just the id because the items rotate: news feeds move on, memes are random and
prices change every minute. Without the snapshot, a vote from last week would point to nothing.

The shape of a snapshot (built in `feedback.service.ts → saveVote`; the values here are made up):

```json
{
  "item": { "title": "DTCC adds Solana to Wall Street tokenization plans", "url": "https://…",
            "sourceName": "CoinDesk", "coins": ["SOL"] },
  "preferences": { "assets": ["bitcoin", "solana"], "investorType": "DAY_TRADER",
                   "contentTypes": ["MARKET_NEWS", "CHARTS"] },
  "votedAt": "2026-11-12T17:42:10.000Z"
}
```

What `item` holds per section:

| Section | `item` in the snapshot |
|---|---|
| News | title, url, source name, tagged coins |
| Prices | symbol, price, 24h change |
| Insight | the text and the model that wrote it |
| Meme | title, image URL or text |

**`DailyInsight`**: one AI insight per user per day, with the **exact prompt** that produced it and the
**model** name. Joined to `Feedback` on `itemId = DailyInsight.id`, every insight vote becomes a complete
LLM training example: *(prompt, response, model, 👍/👎)*.

So each vote already answers the three questions a training example needs: **context** (preferences, time),
**content** (the snapshot), and **label** (the vote).

---

## 2. From database rows to a dataset

A nightly job (a cron on Render, or a scheduled worker) exports the new and changed rows to a versioned dataset:

1. **Read** `Feedback` (joined with `DailyInsight` for insights) for rows updated since the last run.
2. **Anonymise:** replace `userId` with a salted hash. No email, name or password hash ever leaves the database.
3. **Flatten** each row into `(context, content, label)`: e.g. `investorType`, `assets`, `contentTypes`,
   hour of day, section, the item's features, and `vote`.
4. **Write** JSONL or Parquet to object storage, one folder per date (`feedback/2026-11-13/…`), so every
   model can name the exact dataset version it was trained on and be reproduced later.

Training never runs against the production database, so it can't slow the app down.

---

## 3. What we would train, per section

The four sections are different problems, so they get different approaches. Each one has a cold start
(no votes yet), and for that we keep today's rules.

### 3.1 AI Insight of the Day: improve the LLM output

This is the richest data: we have the full prompt, the model, and a label.

1. **First, prompt and model selection (cheap, no training).** Group 👍 rates by model and by prompt version.
   If one free model gets clearly more 👍, put it first in `OPENROUTER_MODELS`. Read the 👎 insights by hand to
   find patterns ("too generic", "repeats the price", "wrong for HODLers") and fix the prompt. This needs a
   `promptVersion` column so we can compare prompts fairly (see section 7).
2. **Then, few-shot examples.** Add 2-3 highly rated past insights for the *same investor type* to the prompt as
   examples of the style that works.
3. **Later, fine-tuning, once there are thousands of votes.**
   - *Supervised fine-tuning (SFT)* on the 👍 insights: teaches the style users liked.
   - *Preference tuning (DPO)*: needs **pairs**, a liked and a disliked answer for a similar context. Pair a 👍 and a
     👎 insight from users with the same investor type and coins on the same day, or show two insights side by
     side now and then and ask which is better. DPO is simpler and cheaper than full RLHF (no separate reward
     model to train), and it learns directly from "this one, not that one".
   - We would fine-tune an open model (for example a Llama or Gemma variant), since the free hosted models can't be
     fine-tuned.

### 3.2 News and memes: learn to rank

Today the news order is a rule (the user's coins first, then newest), and a 👎 only hides that one item for that
user. With votes we can **learn what each kind of user likes** and re-rank the whole feed:

- **Features:** the item (source, tagged coins, title keywords or a text embedding, age) × the user
  (investor type, coins, content types).
- **Model:** start with a logistic regression or gradient-boosted trees predicting P(👍). Then sort the candidates
  by that score. It's simple, fast and explainable ("Day Traders like CoinDesk market stories").
- **Collaborative signal later:** "users like you liked this" (matrix factorisation or embeddings), once there
  are enough users.
- **Memes:** the same idea, with title embeddings and subreddit as features. Plus a safety filter (below).

### 3.3 Coin prices: an interest signal, not a quality signal

A 👎 on a price is ambiguous: the user may dislike the coin, or just dislike that it went down. So we wouldn't
"train prices". We would use the votes as an **interest signal**: which coins to suggest in
"Biggest moves (24h)", and which coins to suggest adding in the quiz.

---

## 4. How we would know it worked

1. **Offline first:** train on older votes, test on the most recent ones (a time split, never random, so we
   never train on the future). Metrics: AUC or log-loss for P(👍), NDCG for the ranked feeds.
2. **Then an A/B test:** a share of users gets the new model, the rest keep the current one. Compare the
   **👍 ratio**, the **vote rate**, and return visits over one to two weeks.
3. **Ship only if it wins** on those and doesn't break a guardrail (below). Every model and prompt version is
   recorded, so we can always roll back.

---

## 5. Data quality and bias (the honest problems)

- **Sparse votes.** Most people never vote. Add implicit signals: clicking a story, time spent on the card,
  "Another one" on memes (a soft 👎), and returning the next day.
- **Position bias.** Items at the top get more votes simply because they're seen first. Store the position each
  item was shown at, and correct for it (or shuffle a little now and then to measure it).
- **Selection bias.** We only get votes on what we chose to show, so the model can get stuck in a loop.
  Keep some exploration: a small share of items not chosen by the model.
- **Snapshots come from the browser.** Today the client sends the `content` of what it showed. That's fine for a
  demo, but a modified client could send anything. In production the server would rebuild the snapshot from its
  own data (it knows what it served for that `itemId`) and store that instead.
- **One vote per item per user.** The unique key already prevents duplicates; `updatedAt` vs `createdAt` shows
  changed minds.
- **Fallback content.** Votes on sample content (`model = "fallback"` insights, built-in news) are about our
  templates, not the live models, so they're kept apart.

---

## 6. Guardrails, privacy and consent

- **No financial advice.** The system prompt already says "do not tell them to buy or sell". A fine-tuned model is
  checked automatically on held-out prompts for buy/sell language and promised returns before release, because
  users might 👍 a hype message.
- **Meme safety.** NSFW posts are already filtered. Add a toxicity classifier before a meme is shown, and never
  train on 👍 for content that the filter flags.
- **Privacy.** Only hashed user ids leave the database. Deleting a user row already deletes their feedback and
  insights (the relations have `onDelete: Cascade`), but the app has no "delete my account" button yet, so that
  comes first. The export job should then also drop that user's rows from future dataset versions.
- **Consent and retention.** Tell users in plain words that votes improve recommendations (the dashboard footer
  already does), and keep raw feedback for a limited time, e.g. 12 months.

---

## 7. What we would add to the schema first

Small changes that make the data much more useful, in order of value:

| Addition | Why |
|---|---|
| `DailyInsight.promptVersion` | Compare prompts fairly; know which prompt produced each vote |
| `Feedback.position` (and the list it was in) | Correct for position bias |
| `Feedback.modelVersion` for ranked sections | Know which ranking model chose the item |
| An `Impression` table (what was shown, even without a vote) | Turns "not voted" into a usable signal and gives the vote rate |
| Click events on news | The strongest implicit signal we're missing |

---

## 8. A realistic roadmap

1. **Now (no ML):** dashboards on the votes: 👍 ratio per section, per model, per news source.
   Switch models and fix prompts from what they show.
2. **Next:** add the schema fields above, the nightly export, and a learned re-ranker for news, behind an A/B test.
3. **With thousands of insight votes:** few-shot prompts, then SFT/DPO on an open model, released only after the
   offline checks, the guardrail checks and an A/B win.
