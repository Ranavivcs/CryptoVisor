import { ApiError, type FieldErrors } from '../api/client';

/**
 * Splits a mutation error into what a form shows: per-field messages, and a form-level
 * message only when there are no field messages to show instead. Used by LoginPage, SignupPage and Quiz.
 */
export function formErrors(error: unknown): { fields: FieldErrors; form?: string } {
  if (!error) return { fields: {} };
  if (error instanceof ApiError) {
    const hasFieldErrors = Object.keys(error.fieldErrors).length > 0;
    return { fields: error.fieldErrors, form: hasFieldErrors ? undefined : error.message };
  }
  return { fields: {}, form: 'Could not reach the server. Please try again.' };
}
