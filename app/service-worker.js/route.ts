import serviceWorker from "../../assets/service-worker.js?raw";

export function GET() {
  return new Response(serviceWorker, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
