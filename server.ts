import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocket } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  initializeSocket(server);

  const port = parseInt(process.env.PORT || "3000", 10);

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.io server initialized`);
  });
});
