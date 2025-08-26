const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the root directory of the project
app.use(express.static(path.join(__dirname, '')));

// The admin panel is served because it's in a subdirectory of the root
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API endpoint to save the data
app.post('/api/save-data', (req, res) => {
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
    console.log(`Admin panel should be available at http://localhost:${PORT}/admin/`);
});
