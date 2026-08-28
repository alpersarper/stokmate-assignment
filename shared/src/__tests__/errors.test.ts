import { describe, expect, it } from 'vitest';
import { ApiError, errorFromResponse, isApiError, networkError } from '../api/errors';

function textResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

describe('errorFromResponse', () => {
  it('preserves Turkish text/plain bodies', async () => {
    const error = await errorFromResponse(textResponse(401, 'E-posta veya şifre hatalı.'));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('E-posta veya şifre hatalı.');
  });

  it('handles empty bodies (unknown-route 404 / 405)', async () => {
    const error = await errorFromResponse(new Response(null, { status: 404 }));
    expect(error.status).toBe(404);
    expect(error.message).toBe('');
  });

  it('extracts detail/title from JSON ProblemDetails (415 case)', async () => {
    const problem = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.13',
      title: 'Unsupported Media Type',
      status: 415,
    };
    const error = await errorFromResponse(
      new Response(JSON.stringify(problem), {
        status: 415,
        headers: { 'content-type': 'application/problem+json' },
      }),
    );
    expect(error.status).toBe(415);
    expect(error.message).toBe('Unsupported Media Type');
  });

  it('falls back to raw text when a JSON content-type lies', async () => {
    const error = await errorFromResponse(
      new Response('not json at all', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(error.status).toBe(500);
    expect(error.message).toBe('not json at all');
  });

  it('never throws on a body that claims JSON but is empty', async () => {
    const error = await errorFromResponse(
      new Response('', { status: 400, headers: { 'content-type': 'application/json' } }),
    );
    expect(error.status).toBe(400);
    expect(error.message).toBe('');
  });
});

describe('networkError / isApiError', () => {
  it('wraps fetch-level failures as status 0', () => {
    const error = networkError(new TypeError('fetch failed'));
    expect(error.status).toBe(0);
    expect(error.message).toContain('fetch failed');
    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});
