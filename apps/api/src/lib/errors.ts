export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
