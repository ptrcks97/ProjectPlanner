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

  return fetch(url, requestInit);
}
