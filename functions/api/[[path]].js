// Proxy /api/* requests to the Django backend through Cloudflare Tunnel.
const API_ORIGIN = "https://api.gcers.org";

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, API_ORIGIN);

  const init = {
    method: request.method,
    headers: request.headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  return fetch(target, init);
};
