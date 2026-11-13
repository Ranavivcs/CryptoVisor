/**
 * An error that already knows its HTTP status. Services throw it;
 * the error-handler middleware turns it into a JSON response.
 */
export class HttpError extends Error {
  readonly status: number;

  /**  status the HTTP status to answer with, e.g. 401 or 409. */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
