/**
 * Input Validation Utilities
 * Sanitize and validate user inputs before storing in Supabase
 */

/**
 * Sanitize text input to prevent XSS attacks
 * - Removes HTML/script tags
 * - Limits length to 100 chars
 * - Trims whitespace
 */
export const sanitizeText = (input: string, maxLength = 100): string => {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove angle brackets
    .slice(0, maxLength);
};

/**
 * Validate canvas drawing coordinates
 * - Ensures coordinates are within bounds
 * - Prevents out-of-bounds drawing
 */
export const validateCanvasCoords = (
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): boolean => {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    y >= 0 &&
    x <= maxWidth &&
    y <= maxHeight
  );
};

/**
 * Validate score before storing
 * - Must be positive integer
 * - Must be under 1,000,000
 */
export const validateScore = (score: number): boolean => {
  return (
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 1000000
  );
};

/**
 * Validate game session data
 * - All required fields present
 * - Data types correct
 */
export const validateGameSession = (data: Record<string, any>): boolean => {
  const required = ["gameType", "userId", "score", "difficulty"];
  return required.every(field => field in data && data[field] !== null);
};

/**
 * Rate limit helper - prevent spam submissions
 * Returns true if enough time has passed since last submission
 */
export class RateLimiter {
  private lastSubmit = 0;
  private minInterval: number;

  constructor(minIntervalMs = 500) {
    this.minInterval = minIntervalMs;
  }

  canSubmit(): boolean {
    const now = Date.now();
    if (now - this.lastSubmit >= this.minInterval) {
      this.lastSubmit = now;
      return true;
    }
    return false;
  }

  reset() {
    this.lastSubmit = 0;
  }
}
