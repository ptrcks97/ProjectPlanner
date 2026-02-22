const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  if (window.API_BASE) return window.API_BASE;
  // If opened via file:// fallback to local json-server default.
  if (window.location?.origin?.startsWith('file:')) return 'http://localhost:3000';
  return '';
})();

function withBase(url) {
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return API_BASE + url;
  return url;
}

export async function apiRequest(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    ...rest
  } = options;

  const hasJsonBody = body !== undefined && body !== null;
  const finalHeaders = hasJsonBody
    ? { 'Content-Type': 'application/json', ...headers }
    : headers;

  const requestInit = {
    method,
    headers: finalHeaders,
    ...rest
  };

  if (hasJsonBody) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return fetch(withBase(url), requestInit);
}
