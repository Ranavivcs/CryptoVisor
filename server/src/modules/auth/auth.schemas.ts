import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email'));

export const RegisterSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
