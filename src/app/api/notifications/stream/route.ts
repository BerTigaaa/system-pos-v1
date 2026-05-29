import { auth } from "@/lib/auth";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      const client = new Client({ connectionString: process.env.DATABASE_URL });

      client.connect().then(() => {
        client.query("LISTEN new_notification").catch(() => {});
      }).catch((err) => {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`),
        );
      });

      client.on("notification", (msg) => {
        if (msg.payload === userId) {
          controller.enqueue(encoder.encode("event: refresh\ndata: {}\n\n"));
        }
      });

      client.on("error", () => {});

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        client.end().catch(() => {});
      });
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
