## 2025-12-19 - Critical Exposure of Source & Admin Panel
**Vulnerability:** The server exposes the entire root directory via `express.static` and lacks authentication on admin endpoints.
**Learning:** `app.use(express.static(path.join(__dirname, '')))` is extremely dangerous as it exposes `.env`, `.git`, source code, and admin panels if not carefully managed.
**Prevention:** Never serve the root directory. Serve a specific `public` folder. Always add authentication middleware before serving sensitive routes or static files.

## 2024-05-23 - Stored XSS via innerHTML
**Vulnerability:** Application rendered data from `ebike-data.json` directly into the DOM using `innerHTML` without sanitization.
**Learning:** Using `innerHTML` with untrusted data is a classic XSS vector. Even if the data comes from an "admin" source, it should be treated as untrusted to prevent stored XSS.
**Prevention:** Always escape dynamic data before inserting it into the DOM. Use `textContent` where possible. If HTML must be used, sanitize it with a robust library or a comprehensive escape function. Use `encodeURIComponent` for URL parameters and validate URL protocols (e.g., prevent `javascript:`).
