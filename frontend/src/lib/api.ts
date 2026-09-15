/**
 * Safe API client utility to prevent "Unexpected token 'I', Internal Server Error is not valid JSON" crashes.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();

    let parsedData: any = null;
    try {
      parsedData = text ? JSON.parse(text) : null;
    } catch {
      // Body is not valid JSON (e.g. HTML error page or raw "Internal Server Error")
      const fallbackMessage = !res.ok
        ? `Server error (${res.status}): ${text.slice(0, 120) || res.statusText || 'Analysis service temporarily unavailable'}`
        : 'Invalid response format from server';
      return {
        ok: false,
        status: res.status,
        error: fallbackMessage,
      };
    }

    if (!res.ok) {
      const errMsg =
        parsedData?.error?.message ||
        parsedData?.error ||
        parsedData?.message ||
        `Request failed with status ${res.status}`;
      return {
        ok: false,
        status: res.status,
        error: errMsg,
        data: parsedData,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network error contacting backend service',
    };
  }
}
