const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json()); // To parse JSON bodies

// Sports endpoint (already present)
app.get("/api", (req, res) => {
    res.json({ sports: ["MLB", "NHL", "NBA", "WNBA", "NFL"] });
});

// Endpoint to save deficit
app.post("/api/deficit", (req, res) => {
    const deficit = req.body;
    const filePath = path.join(__dirname, 'deficits.json');
    let existing = [];
    if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    existing.push(deficit);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    res.json({ status: 'success', saved: deficit });
});

// Endpoint to get all deficits
app.get('/api/deficits', (req, res) => {
  fs.readFile(path.join(__dirname, 'deficits.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Could not read deficits.json' });
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Malformed deficits.json' });
    }
  });
});

// Endpoint to delete a single deficit by index
app.delete('/api/deficits/:index', (req, res) => {
    const filePath = path.join(__dirname, 'deficits.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Could not read deficits.json' });
        let deficits = [];
        try {
            deficits = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'Malformed deficits.json' });
        }
        const idx = parseInt(req.params.index, 10);
        if (isNaN(idx) || idx < 0 || idx >= deficits.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        deficits.splice(idx, 1);
        fs.writeFile(filePath, JSON.stringify(deficits, null, 2), err2 => {
            if (err2) return res.status(500).json({ error: 'Could not write deficits.json' });
            res.json({ success: true });
        });
    });
});

// Endpoint to delete all deficits
app.delete('/api/deficits', (req, res) => {
    const filePath = path.join(__dirname, 'deficits.json');
    fs.writeFile(filePath, '[]', err => {
        if (err) return res.status(500).json({ error: 'Could not clear deficits.json' });
        res.json({ success: true });
    });
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});