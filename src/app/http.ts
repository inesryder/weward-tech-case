import { API_BASE_URL } from "./config";

const REQUEST_TIMEOUT_MS = 10_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
};

async function request(path: string, { method = "GET", body, signal }: RequestOptions): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) abort();

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${path} failed with ${res.status}`);
    return await res.json();
  } catch (error) {
    if (timedOut) throw new Error(`${method} ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function fetchJson(path: string, signal?: AbortSignal): Promise<unknown> {
  return request(path, { signal });
}

export function sendJson(method: "POST" | "PATCH", path: string, body: unknown): Promise<unknown> {
  return request(path, { method, body });
}
