## 2025-12-19 - Critical Exposure of Source & Admin Panel
**Vulnerability:** The server exposes the entire root directory via `express.static` and lacks authentication on admin endpoints.
**Learning:** `app.use(express.static(path.join(__dirname, '')))` is extremely dangerous as it exposes `.env`, `.git`, source code, and admin panels if not carefully managed.
**Prevention:** Never serve the root directory. Serve a specific `public` folder. Always add authentication middleware before serving sensitive routes or static files.
