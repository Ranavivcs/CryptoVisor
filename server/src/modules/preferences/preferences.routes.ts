import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './preferences.controller.js';
import { PreferencesSchema } from './preferences.schemas.js';

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);
preferencesRouter.get('/options', controller.options);
preferencesRouter.get('/', controller.get);
preferencesRouter.put('/', validateBody(PreferencesSchema), controller.save);
