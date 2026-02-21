import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/sse-broadcast";

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {}
      };
      try {
        controller.enqueue(encoder.encode(": stream open\n\n"));
      } catch {}
      send("connected", JSON.stringify({ at: new Date().toISOString() }));

      const heartbeat = setInterval(() => {
        send("heartbeat", JSON.stringify({ at: new Date().toISOString() }));
      }, 30_000);

      const unsub = subscribe((event, data) => send(event, data));

      request.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
