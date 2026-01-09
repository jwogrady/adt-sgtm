const UPSTREAM_HOST = process.env.UPSTREAM_HOST || "server-side-tagging.example.com";
const PORT = parseInt(process.env.PORT || "8080", 10);
const MAX_REQUEST_SIZE = 2 * 1024 * 1024; // 2MB
const UPSTREAM_TIMEOUT = 10_000; // 10s

const PROXY_PATHS = ["/g/", "/gtm.js", "/gtag/js"];

function shouldProxy(pathname: string): boolean {
  return PROXY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path)
  );
}

function log(level: string, message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...meta }));
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname, search } = url;

  if (!shouldProxy(pathname)) {
    log("info", "not_found", { path: pathname });
    return new Response("Not Found", { status: 404 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    log("warn", "request_too_large", { path: pathname, size: contentLength });
    return new Response("Request Entity Too Large", { status: 413 });
  }

  const upstreamUrl = `https://${UPSTREAM_HOST}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("host", UPSTREAM_HOST);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.body,
      signal: controller.signal,
      // @ts-expect-error Bun-specific option for streaming
      duplex: "half",
    });

    clearTimeout(timeout);

    log("info", "proxy_success", { path: pathname, status: upstreamRes.status });

    const responseHeaders = new Headers(upstreamRes.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      log("error", "upstream_timeout", { path: pathname });
      return new Response("Gateway Timeout", { status: 504 });
    }

    log("error", "upstream_error", { path: pathname, error: String(err) });
    return new Response("Bad Gateway", { status: 502 });
  }
}

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

log("info", "server_started", { port: server.port, upstream: UPSTREAM_HOST });
