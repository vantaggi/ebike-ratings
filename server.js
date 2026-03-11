require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const basicAuth = require('express-basic-auth');
const rateLimit = require('./middleware/rate-limiter');

const app = express();
const PORT = 3000;

// trust first proxy
app.set('trust proxy', 1);

// Middleware to parse JSON bodies
app.use(express.json());

// Configure sensitive files to block
const DEFAULT_SENSITIVE_FILES = '.env,.git,package.json,package-lock.json,server.js,ebike-data.json.bak';
const sensitiveFilesList = (process.env.SENSITIVE_FILES || DEFAULT_SENSITIVE_FILES)
    .split(',')
    .map(file => file.trim())
    .filter(file => file.length > 0);
const sensitiveFilesSet = new Set(sensitiveFilesList);

// Security Middleware: Block access to sensitive files
app.use((req, res, next) => {
    const p = req.path;

    // Block dotfiles (like .env, .git/config)
    if (p.includes('/.')) {
        return res.status(403).send('Forbidden');
    }

    // Block specific sensitive files by filename
    const filename = p.split('/').pop();
    if (filename && sensitiveFilesSet.has(filename)) {
        return res.status(403).send('Forbidden');
    }

    next();
});

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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
});

// Basic Authentication Middleware
const authMiddleware = basicAuth({
    users: { [adminUser]: adminPass },
    challenge: true,
    realm: 'Admin Area'
});

// Protect Admin Panel and API
app.use('/admin', authLimiter, authMiddleware, express.static(path.join(__dirname, 'admin')));

// Serve the ebike-data.json file explicitly
app.get('/ebike-data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'ebike-data.json'));
});

// API endpoint to save the data
app.post('/api/save-data', authLimiter, authMiddleware, (req, res) => {
    const newData = req.body;

    if (!newData || Object.keys(newData).length === 0) {
        return res.status(400).json({ message: "Errore: Dati non validi o mancanti." });
    }

    const filePath = path.join(__dirname, 'ebike-data.json');
    const fileContent = JSON.stringify(newData, null, 2); // Pretty print

    try {
        await fs.promises.writeFile(filePath, fileContent, 'utf8');
        console.log("Dati salvati con successo su ebike-data.json");
        res.json({ message: "Dati salvati con successo!" });
    } catch (err) {
        console.error("Errore durante il salvataggio del file:", err);
        return res.status(500).json({ message: "Errore interno del server durante il salvataggio." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin panel is available at http://localhost:${PORT}/admin/`);
});
