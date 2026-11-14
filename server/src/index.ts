import { createApp } from './app.js';
import { env } from './config/env.js';
import { startPriceWarmer } from './providers/prices.coingecko.js';

createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
// Fill the price cache now and keep it fresh, so the first dashboard load doesn't wait on CoinGecko.
startPriceWarmer();
