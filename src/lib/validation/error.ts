/** Raised when a request payload is structurally or semantically invalid. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
