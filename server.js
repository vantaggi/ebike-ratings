require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Security Middleware: Block access to sensitive files
app.use((req, res, next) => {
    const sensitiveFiles = ['.env', '.git', 'package.json', 'package-lock.json', 'server.js', 'ebike-data.json.bak'];
    const p = req.path;

    // Block dotfiles (like .env, .git/config)
    if (p.includes('/.')) {
        return res.status(403).send('Forbidden');
    }

    // Block specific sensitive files
    if (sensitiveFiles.some(file => p === '/' + file || p.endsWith('/' + file))) {
        return res.status(403).send('Forbidden');
    }

    next();
});

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
    const auth = { login: process.env.ADMIN_USER, password: process.env.ADMIN_PASS };

    // If env vars are not set, warn but allow (or block? safe to block)
    // For security, we should default to safe values or fail if not set.
    // Given the task, I'll log a warning if missing and require auth.
    if (!auth.login || !auth.password) {
        console.warn('ADMIN_USER or ADMIN_PASS not set in environment.');
        // For now, fail secure
        // return res.status(500).send('Server misconfiguration: Missing admin credentials.');
    }

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, ...passwordParts] = Buffer.from(b64auth, 'base64').toString().split(':');
    const password = passwordParts.join(':');

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Authentication required.');
};

// Protect Admin and API routes
app.use(['/admin', '/api/save-data'], basicAuth);

// Serve static files from the root directory of the project
// Moved AFTER security checks
app.use(express.static(path.join(__dirname, '')));
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Ensure admin credentials are set
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;

if (!adminUser || !adminPass) {
    console.error("FATAL ERROR: ADMIN_USER and ADMIN_PASS environment variables must be set.");
    process.exit(1);
}

// Basic Authentication Middleware
const authMiddleware = basicAuth({
    users: { [adminUser]: adminPass },
    challenge: true,
    realm: 'Admin Area'
});

// Protect Admin Panel and API
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));

// Serve the ebike-data.json file explicitly
app.get('/ebike-data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'ebike-data.json'));
});

// API endpoint to save the data
app.post('/api/save-data', authMiddleware, (req, res) => {
    const newData = req.body;

    if (!newData || Object.keys(newData).length === 0) {
        return res.status(400).json({ message: "Errore: Dati non validi o mancanti." });
    }

    const filePath = path.join(__dirname, 'ebike-data.json');
    const fileContent = JSON.stringify(newData, null, 2); // Pretty print

    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
        if (err) {
            console.error("Errore durante il salvataggio del file:", err);
            return res.status(500).json({ message: "Errore interno del server durante il salvataggio." });
        }

        console.log("Dati salvati con successo su ebike-data.json");
        res.json({ message: "Dati salvati con successo!" });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin panel is available at http://localhost:${PORT}/admin/`);
});
