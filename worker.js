// Proxy /api/* requests to the Django backend through Cloudflare Tunnel.
const API_ORIGIN = "https://api.gcers.org";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const target = new URL(url.pathname + url.search, API_ORIGIN);
      return fetch(target, {
        method: request.method,
        headers: request.headers,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer(),
      });
    }

    // Non-API paths are handled by static assets (run_worker_first only
    // routes /api/* here); fall back to a plain 404 just in case.
    return new Response("Not found", { status: 404 });
  },
};
