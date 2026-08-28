/**
 * Normalized API error. The backend's error bodies are Turkish text/plain, except:
 * 415 → JSON ProblemDetails; unknown-route 404 / 405 → empty body. Never assume JSON.
 * `status === 0` means the request never produced an HTTP response (network failure).
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Build an ApiError from a non-2xx response without ever assuming a body format:
 * read as text; parse ProblemDetails only when the content-type says JSON; tolerate
 * empty and unreadable bodies. Backend-provided text is preserved as the message.
 */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  let message = '';
  try {
    const text = await response.text();
    if (text) {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('json')) {
        try {
          const problem: unknown = JSON.parse(text);
          if (problem && typeof problem === 'object') {
            const p = problem as { detail?: unknown; title?: unknown; message?: unknown };
            message =
              [p.detail, p.title, p.message].find((v): v is string => typeof v === 'string') ??
              text;
          } else {
            message = text;
          }
        } catch {
          message = text;
        }
      } else {
        message = text;
      }
    }
  } catch {
    // body unreadable — keep message empty; status still identifies the failure
  }
  return new ApiError(response.status, message.trim());
}

/** Wrap a fetch-level failure (no HTTP response at all) into the normalized shape. */
export function networkError(cause: unknown): ApiError {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new ApiError(0, `Network request failed: ${detail}`);
}
