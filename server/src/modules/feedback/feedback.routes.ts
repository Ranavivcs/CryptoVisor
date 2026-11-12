import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './feedback.controller.js';
import { VoteSchema } from './feedback.schemas.js';

export const feedbackRouter = Router();

feedbackRouter.use(requireAuth);
feedbackRouter.put('/', validateBody(VoteSchema), controller.vote);
feedbackRouter.delete('/:section/:itemId', controller.unvote);
