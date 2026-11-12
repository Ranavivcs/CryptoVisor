import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { LoginSchema, RegisterSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(RegisterSchema), controller.register);
authRouter.post('/login', validateBody(LoginSchema), controller.login);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);
