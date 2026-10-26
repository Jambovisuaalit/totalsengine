/**
 * Retry utility with exponential backoff for external API calls.
 * 
 * Usage:
 * const response = await fetchWithRetry(() => fetch(url, options));
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should trigger a retry (default: [429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
  /** Callback for logging retry attempts */
  onRetry?: (attempt: number, error: Error | Response, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Execute a fetch operation with retry logic and exponential backoff.
 * 
 * @param operation - Function that returns a Promise<Response>
 * @param options - Retry configuration options
 * @returns The successful Response
 * @throws The last error if all retries are exhausted
 */
export async function fetchWithRetry(
  operation: () => Promise<Response>,
  options: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const response = await operation();

      // Check if response status is retryable
      if (config.retryableStatuses.includes(response.status)) {
        if (attempt < config.maxAttempts) {
          const delayMs = calculateDelay(
            attempt,
            config.initialDelayMs,
            config.maxDelayMs,
            config.backoffMultiplier
          );
          
          options.onRetry?.(attempt, response, delayMs);
          console.log(
            `[Retry] Attempt ${attempt}/${config.maxAttempts} failed with status ${response.status}. ` +
            `Retrying in ${delayMs.toFixed(0)}ms...`
          );
          
          await sleep(delayMs);
          continue;
        }
      }

      // Success or non-retryable status
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxAttempts) {
        const delayMs = calculateDelay(
          attempt,
          config.initialDelayMs,
          config.maxDelayMs,
          config.backoffMultiplier
        );
        
        options.onRetry?.(attempt, lastError, delayMs);
        console.log(
          `[Retry] Attempt ${attempt}/${config.maxAttempts} failed with error: ${lastError.message}. ` +
          `Retrying in ${delayMs.toFixed(0)}ms...`
        );
        
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error("All retry attempts exhausted");
}

/**
 * Execute any async operation with retry logic and exponential backoff.
 * Use this for non-fetch operations (e.g., SDK calls).
 * 
 * @param operation - Function that returns a Promise<T>
 * @param options - Retry configuration options
 * @returns The successful result of type T
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Omit<RetryOptions, 'retryableStatuses'> = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxAttempts) {
        const delayMs = calculateDelay(
          attempt,
          config.initialDelayMs,
          config.maxDelayMs,
          config.backoffMultiplier
        );
        
        options.onRetry?.(attempt, lastError, delayMs);
        console.log(
          `[Retry] Attempt ${attempt}/${config.maxAttempts} failed with error: ${lastError.message}. ` +
          `Retrying in ${delayMs.toFixed(0)}ms...`
        );
        
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error("All retry attempts exhausted");
}