const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Update CORS options for development
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
  const filePath = path.join(__dirname, "deficits.json");
  let existing = [];
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  existing.push(deficit);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  res.json({ status: "success", saved: deficit });
});

// Endpoint to get all deficits
app.get("/api/deficits", (req, res) => {
  fs.readFile(path.join(__dirname, "deficits.json"), "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read deficits.json" });
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: "Malformed deficits.json" });
    }
  });
});

// Endpoint to delete a single deficit by index
app.delete("/api/deficits/:index", (req, res) => {
  const filePath = path.join(__dirname, "deficits.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read deficits.json" });
    let deficits = [];
    try {
      deficits = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Malformed deficits.json" });
    }
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= deficits.length) {
      return res.status(400).json({ error: "Invalid index" });
    }
    deficits.splice(idx, 1);
    fs.writeFile(filePath, JSON.stringify(deficits, null, 2), (err2) => {
      if (err2)
        return res.status(500).json({ error: "Could not write deficits.json" });
      res.json({ success: true });
    });
  });
});

// Endpoint to delete all deficits
app.delete("/api/deficits", (req, res) => {
  const filePath = path.join(__dirname, "deficits.json");
  fs.writeFile(filePath, "[]", (err) => {
    if (err)
      return res.status(500).json({ error: "Could not clear deficits.json" });
    res.json({ success: true });
  });
});

// Pending Wagers endpoints
app.post("/api/pendingWager", (req, res) => {
  const wager = req.body;
  const filePath = path.join(__dirname, "pendingWagers.json");
  let existing = [];
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  existing.push(wager);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  res.json({ status: "success", saved: wager });
});

app.get("/api/pendingWagers", (req, res) => {
  fs.readFile(path.join(__dirname, "pendingWagers.json"), "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read pendingWagers.json" });
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: "Malformed pendingWagers.json" });
    }
  });
});

app.delete("/api/pendingWagers/:index", (req, res) => {
  const filePath = path.join(__dirname, "pendingWagers.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read pendingWagers.json" });
    let wagers = [];
    try {
      wagers = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Malformed pendingWagers.json" });
    }
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= wagers.length) {
      return res.status(400).json({ error: "Invalid index" });
    }
    wagers.splice(idx, 1);
    fs.writeFile(filePath, JSON.stringify(wagers, null, 2), (err2) => {
      if (err2)
        return res.status(500).json({ error: "Could not write pendingWagers.json" });
      res.json({ success: true });
    });
  });
});

app.delete("/api/pendingWagers", (req, res) => {
  const filePath = path.join(__dirname, "pendingWagers.json");
  fs.writeFile(filePath, "[]", (err) => {
    if (err)
      return res.status(500).json({ error: "Could not clear pendingWagers.json" });
    res.json({ success: true });
  });
});

// Delete all pending wagers for a game (by gameKey or by sport/date/type/team)
app.delete("/api/pendingWagers/game", (req, res) => {
  console.log("/api/pendingWagers/game req.body:", req.body);
  const { gameKey, sport, date, teams } = req.body;
  const filePath = path.join(__dirname, "pendingWagers.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Could not read pendingWagers.json" });
    let wagers = [];
    try {
      wagers = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Malformed pendingWagers.json" });
    }
    let filtered;
    if (gameKey) {
      filtered = wagers.filter((w) => w.gameKey !== gameKey);
    } else if (sport && date && Array.isArray(teams) && teams.length > 0) {
      // Trim all team names for robust comparison
      const trimmedTeams = teams.map((t) => (t || "").trim());
      filtered = wagers.filter(
        (w) =>
          !(
            w.sport === sport &&
            w.date === date &&
            trimmedTeams.includes((w.team || "").trim())
          )
      );
    } else {
      return res.status(400).json({ error: "Missing gameKey or sport/date/teams" });
    }
    fs.writeFile(filePath, JSON.stringify(filtered, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: "Could not write pendingWagers.json" });
      res.json({ success: true });
    });
  });
});

// Delete all pending wagers for a game (by gameKey or by sport/date/type/team) - POST version for frontend compatibility
app.post("/api/pendingWagers/game", (req, res) => {
  console.log("/api/pendingWagers/game req.body:", req.body);
  const { gameKey, sport, date, teams } = req.body;
  const filePath = path.join(__dirname, "pendingWagers.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Could not read pendingWagers.json" });
    let wagers = [];
    try {
      wagers = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Malformed pendingWagers.json" });
    }
    let filtered;
    if (gameKey) {
      filtered = wagers.filter((w) => w.gameKey !== gameKey);
    } else if (sport && date && Array.isArray(teams) && teams.length > 0) {
      // Trim all team names for robust comparison
      const trimmedTeams = teams.map((t) => (t || "").trim());
      filtered = wagers.filter(
        (w) =>
          !(
            w.sport === sport &&
            w.date === date &&
            trimmedTeams.includes((w.team || "").trim())
          )
      );
    } else {
      return res.status(400).json({ error: "Missing gameKey or sport/date/teams" });
    }
    fs.writeFile(filePath, JSON.stringify(filtered, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: "Could not write pendingWagers.json" });
      res.json({ success: true });
    });
  });
});

// Settled Wagers endpoints
app.post("/api/settledWager", (req, res) => {
  const winner = req.body;
  const filePath = path.join(__dirname, "settledWagers.json");
  let existing = [];
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  existing.push(winner);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  res.json({ status: "success", saved: winner });
});

app.get("/api/settledWagers", (req, res) => {
  fs.readFile(path.join(__dirname, "settledWagers.json"), "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read settledWagers.json" });
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: "Malformed settledWagers.json" });
    }
  });
});

// Settle a game: add both winner (toWin, positive) and loser (risk, negative) to settledWagers.json
app.post("/api/settleGame", (req, res) => {
  const { winner, loser, gameKey, sport, date, teams } = req.body;
  const pendingPath = path.join(__dirname, "pendingWagers.json");
  const settledPath = path.join(__dirname, "settledWagers.json");
  let pending = [];
  if (fs.existsSync(pendingPath)) {
    pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
  }
  // Find all wagers for this game
  let gameWagers = [];
  if (gameKey) {
    gameWagers = pending.filter((w) => w.gameKey === gameKey);
  } else if (sport && date && Array.isArray(teams) && teams.length > 0) {
    const trimmedTeams = teams.map((t) => (t || "").trim());
    gameWagers = pending.filter(
      (w) =>
        w.sport === sport &&
        w.date === date &&
        trimmedTeams.includes((w.team || "").trim())
    );
  } else {
    return res.status(400).json({ error: "Missing gameKey or sport/date/teams" });
  }
  if (gameWagers.length < 2) {
    return res.status(400).json({ error: "Not enough wagers to settle (need winner and loser)" });
  }
  // Identify winner and loser wagers
  const winnerWager = gameWagers.find((w) => w.team === winner.team);
  const loserWager = gameWagers.find((w) => w.team === loser.team);
  if (!winnerWager || !loserWager) {
    return res.status(400).json({ error: "Could not find both winner and loser wagers" });
  }
  // Remove both from pending
  const newPending = pending.filter(
    (w) => !(gameWagers.includes(w))
  );
  fs.writeFileSync(pendingPath, JSON.stringify(newPending, null, 2));
  // Add two entries to settledWagers.json
  let settled = [];
  if (fs.existsSync(settledPath)) {
    settled = JSON.parse(fs.readFileSync(settledPath, "utf8"));
  }
  const now = new Date().toISOString();
  settled.push({ ...winnerWager, amount: winnerWager.toWin, settledAt: now, type: 'win' });
  settled.push({ ...loserWager, amount: -Math.abs(loserWager.risk), settledAt: now, type: 'loss' });
  fs.writeFileSync(settledPath, JSON.stringify(settled, null, 2));
  res.json({ status: "success", settled: [
    { ...winnerWager, amount: winnerWager.toWin, settledAt: now, type: 'win' },
    { ...loserWager, amount: -Math.abs(loserWager.risk), settledAt: now, type: 'loss' }
  ] });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

