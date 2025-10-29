import { getDashboardSnapshot } from "@/lib/db/dashboard";

const encoder = new TextEncoder();

export async function GET() {
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const sendSnapshot = async () => {
        const snapshot = await getDashboardSnapshot();
        const payload = JSON.stringify(snapshot);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      await sendSnapshot();

      interval = setInterval(() => {
        sendSnapshot().catch((error) => {
          console.error("Failed to stream snapshot", error);
        });
      }, 15000);

      controller.enqueue(encoder.encode(":ok\n\n"));
    },
    cancel() {
      console.info("Client disconnected from /api/updates stream");
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
