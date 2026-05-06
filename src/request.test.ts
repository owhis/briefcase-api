import { makeRequest } from './request';
import { Cache } from './cache';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('makeRequest', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches data and returns result', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ id: 1 }));
    const result = await makeRequest<{ id: number }>({ url: 'https://api.example.com/items' });
    expect(result.data).toEqual({ id: 1 });
    expect(result.status).toBe(200);
    expect(result.fromCache).toBe(false);
  });

  it('appends query params to url', async () => {
    mockFetch.mockReturnValueOnce(mockResponse([]));
    await makeRequest({ url: 'https://api.example.com/items', params: { page: 1, limit: 10 } });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=10');
  });

  it('returns cached result on second call', async () => {
    const cache = new Cache();
    mockFetch.mockReturnValueOnce(mockResponse({ id: 42 }));
    const first = await makeRequest<{ id: number }>(
      { url: 'https://api.example.com/items/42', cacheKey: 'item-42', cacheTtl: 5000 },
      cache
    );
    const second = await makeRequest<{ id: number }>(
      { url: 'https://api.example.com/items/42', cacheKey: 'item-42', cacheTtl: 5000 },
      cache
    );
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.data).toEqual({ id: 42 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(
      makeRequest({
        url: 'https://api.example.com/fail',
        retry: { maxRetries: 2, baseDelayMs: 0 },
      })
    ).rejects.toThrow('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws on non-ok HTTP status without retrying non-retryable codes', async () => {
    mockFetch.mockReturnValue(mockResponse(null, 404));
    await expect(
      makeRequest({ url: 'https://api.example.com/missing', retry: { maxRetries: 1, baseDelayMs: 0 } })
    ).rejects.toThrow('HTTP 404');
  });
});
