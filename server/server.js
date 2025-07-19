const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Update CORS options for development
const corsOptions = {
  origin: [process.env.CLIENT_ORIGIN || "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); // To parse JSON bodies

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log("POST body:", req.body);
  }
  next();
});

// Sports endpoint (already present)
app.get("/api", (req, res) => {
  res.json({ sports: ["MLB", "NHL", "NBA", "WNBA", "NFL"] });
});

// Endpoint to save deficit
app.post("/api/deficit", (req, res) => {
  const deficit = req.body;
  const filePath = path.join(__dirname, "deficits.json");
  
  // Use async file operations to prevent race conditions
  fs.readFile(filePath, "utf8", (err, data) => {
    let existing = [];
    if (!err && data) {
      try {
        existing = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing deficits.json:", parseErr);
        return res.status(500).json({ error: "Malformed deficits.json" });
      }
    } else if (err && err.code !== 'ENOENT') {
      console.error("Error reading deficits.json:", err);
      return res.status(500).json({ error: "Could not read deficits.json" });
    }
    
    existing.push(deficit);
    
    fs.writeFile(filePath, JSON.stringify(existing, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing deficits.json:", writeErr);
        return res.status(500).json({ error: "Could not save deficit" });
      }
      res.json({ status: "success", saved: deficit });
    });
  });
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
  
  // Use async file operations to prevent race conditions
  fs.readFile(filePath, "utf8", (err, data) => {
    let existing = [];
    if (!err && data) {
      try {
        existing = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing pendingWagers.json:", parseErr);
        return res.status(500).json({ error: "Malformed pendingWagers.json" });
      }
    } else if (err && err.code !== 'ENOENT') {
      console.error("Error reading pendingWagers.json:", err);
      return res.status(500).json({ error: "Could not read pendingWagers.json" });
    }
    
    existing.push(wager);
    
    fs.writeFile(filePath, JSON.stringify(existing, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing pendingWagers.json:", writeErr);
        return res.status(500).json({ error: "Could not save wager" });
      }
      res.json({ status: "success", saved: wager });
    });
  });
});

// Submit a complete game (both Fav and Dog wagers atomically)
app.post("/api/pendingGame", (req, res) => {
  console.log("=== PENDING GAME REQUEST ===");
  console.log("Request received:", req.body);
  
  const { favWager, dogWager } = req.body;
  
  if (!favWager || !dogWager) {
    return res.status(400).json({ error: "Both favWager and dogWager are required" });
  }

  const filePath = path.join(__dirname, "pendingWagers.json");
  console.log("Using synchronous file operations for:", filePath);
  
  try {
    // Use synchronous operations to prevent race conditions and encoding issues
    let existing = [];
    
    // Check if file exists and read it
    if (fs.existsSync(filePath)) {
      console.log("File exists, reading...");
      const rawData = fs.readFileSync(filePath, { encoding: 'utf8' });
      console.log("Raw file data length:", rawData.length);
      console.log("Raw file data (first 50 chars):", rawData.substring(0, 50));
      
      // Clean any potential BOM or whitespace issues
      const cleanData = rawData.replace(/^\uFEFF/, '').trim();
      console.log("Cleaned data:", cleanData);
      
      if (cleanData && cleanData.length > 0) {
        try {
          existing = JSON.parse(cleanData);
          console.log("Successfully parsed existing wagers:", existing.length);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          console.error("Attempting to reset file...");
          // If parse fails, reset the file
          fs.writeFileSync(filePath, '[]', { encoding: 'utf8' });
          existing = [];
        }
      } else {
        console.log("File is empty or contains only whitespace, initializing as empty array");
        existing = [];
      }
    } else {
      console.log("File doesn't exist, creating new one");
      fs.writeFileSync(filePath, '[]', { encoding: 'utf8' });
      existing = [];
    }
    
    // Add both wagers atomically with timestamps
    const timestamp = new Date().toISOString();
    const gameId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("Generated gameId:", gameId);
    
    // Add gameId and createdAt to both wagers
    const favWagerWithId = { ...favWager, gameId, createdAt: timestamp };
    const dogWagerWithId = { ...dogWager, gameId, createdAt: timestamp };
    
    console.log("favWagerWithId:", favWagerWithId);
    console.log("dogWagerWithId:", dogWagerWithId);
    
    existing.push(favWagerWithId);
    existing.push(dogWagerWithId);
    
    // Write the file with explicit encoding
    const jsonData = JSON.stringify(existing, null, 2);
    console.log("Writing JSON data:", jsonData.substring(0, 100) + "...");
    fs.writeFileSync(filePath, jsonData, { encoding: 'utf8' });
    
    console.log("Successfully saved game with synchronous operations");
    res.json({ status: "success", saved: { favWager: favWagerWithId, dogWager: dogWagerWithId } });
    
  } catch (error) {
    console.error("Synchronous file operation error:", error);
    res.status(500).json({ error: "Could not save game: " + error.message });
  }
});

app.get("/api/pendingWagers", (req, res) => {
  fs.readFile(path.join(__dirname, "pendingWagers.json"), "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read pendingWagers.json" });
    try {
      const wagers = JSON.parse(data);
      
      // Separate wagers with gameId from legacy wagers
      const wagersWithGameId = wagers.filter(w => w.gameId);
      const legacyWagers = wagers.filter(w => !w.gameId);
      
      // For wagers with gameId, group by gameId
      const gameIdGroups = {};
      wagersWithGameId.forEach(wager => {
        if (!gameIdGroups[wager.gameId]) {
          gameIdGroups[wager.gameId] = [];
        }
        gameIdGroups[wager.gameId].push(wager);
      });
      
      // Only include complete games (both Fav and Dog)
      const validWagers = [];
      Object.values(gameIdGroups).forEach(group => {
        if (group.length === 2) {
          const hasFav = group.some(w => w.type === "Fav");
          const hasDog = group.some(w => w.type === "Dog");
          if (hasFav && hasDog) {
            validWagers.push(...group);
          }
        }
      });
      
      // Handle legacy wagers (old grouping logic for backwards compatibility)
      const processed = new Set();
      for (let i = 0; i < legacyWagers.length; i++) {
        if (processed.has(i)) continue;
        
        const wager = legacyWagers[i];
        const counterpartIndex = legacyWagers.findIndex((w, idx) => 
          idx !== i && 
          w.sport === wager.sport && 
          w.date === wager.date && 
          w.type !== wager.type && // Different type (Fav vs Dog)
          !processed.has(idx)
        );
        
        if (counterpartIndex !== -1) {
          validWagers.push(wager);
          validWagers.push(legacyWagers[counterpartIndex]);
          processed.add(i);
          processed.add(counterpartIndex);
        }
      }
      
      res.json(validWagers);
    } catch (e) {
      res.status(500).json({ error: "Malformed pendingWagers.json" });
    }
  });
});

// Clean up orphaned wagers endpoint
app.post("/api/cleanupOrphanedWagers", (req, res) => {
  const filePath = path.join(__dirname, "pendingWagers.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Could not read pendingWagers.json" });
    try {
      const wagers = JSON.parse(data);
      const validWagers = [];
      const processed = new Set();
      let orphansRemoved = 0;
      
      for (let i = 0; i < wagers.length; i++) {
        if (processed.has(i)) continue;
        
        const wager = wagers[i];
        // Look for counterpart
        const counterpartIndex = wagers.findIndex((w, idx) => 
          idx !== i && 
          w.sport === wager.sport && 
          w.date === wager.date && 
          w.type !== wager.type && // Different type (Fav vs Dog)
          !processed.has(idx)
        );
        
        if (counterpartIndex !== -1) {
          // Found a complete pair
          validWagers.push(wager);
          validWagers.push(wagers[counterpartIndex]);
          processed.add(i);
          processed.add(counterpartIndex);
        } else {
          orphansRemoved++;
        }
      }
      
      fs.writeFile(filePath, JSON.stringify(validWagers, null, 2), (writeErr) => {
        if (writeErr)
          return res.status(500).json({ error: "Could not update pendingWagers.json" });
        res.json({ 
          status: "success", 
          message: `Removed ${orphansRemoved} orphaned wager(s)`,
          validWagers: validWagers.length
        });
      });
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
  
  // Use async file operations to prevent race conditions
  fs.readFile(filePath, "utf8", (err, data) => {
    let existing = [];
    if (!err && data) {
      try {
        existing = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing settledWagers.json:", parseErr);
        return res.status(500).json({ error: "Malformed settledWagers.json" });
      }
    } else if (err && err.code !== 'ENOENT') {
      console.error("Error reading settledWagers.json:", err);
      return res.status(500).json({ error: "Could not read settledWagers.json" });
    }
    
    existing.push(winner);
    
    fs.writeFile(filePath, JSON.stringify(existing, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing settledWagers.json:", writeErr);
        return res.status(500).json({ error: "Could not save settled wager" });
      }
      res.json({ status: "success", saved: winner });
    });
  });
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
  console.log("=== SETTLE GAME REQUEST ===");
  console.log("Raw req.body:", req.body);
  console.log("Type of req.body:", typeof req.body);
  
  const { winner, loser, gameKey, gameId, sport, date, teams } = req.body;
  
  console.log("Extracted winner:", winner);
  console.log("Extracted gameId:", gameId);
  console.log("Extracted sport:", sport);
  console.log("Extracted date:", date);
  console.log("Extracted teams:", teams);
  const pendingPath = path.join(__dirname, "pendingWagers.json");
  const settledPath = path.join(__dirname, "settledWagers.json");
  
  let pending = [];
  if (fs.existsSync(pendingPath)) {
    try {
      pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
      console.log("Loaded pending wagers:", pending.length);
      console.log("Pending wagers BEFORE removal:", JSON.stringify(pending, null, 2));
    } catch (error) {
      console.error("Error parsing pending wagers:", error);
      return res.status(500).json({ error: "Error reading pending wagers" });
    }
  }
  

  // Find all wagers for this game, but only remove the exact pair (by gameId if present, else by unique team pair)
  let gameWagers = [];
  if (gameId) {
    // Use gameId for modern wagers
    gameWagers = pending.filter((w) => w.gameId === gameId);
  } else if (gameKey) {
    gameWagers = pending.filter((w) => w.gameKey === gameKey);
  } else if (sport && date && Array.isArray(teams) && teams.length === 2) {
    // For legacy wagers, find only the first matching Fav/Dog pair for the selected teams by index
    const trimmedTeams = teams.map((t) => (t || "").trim());
    let favIndex = -1, dogIndex = -1;
    for (let i = 0; i < pending.length; i++) {
      const w = pending[i];
      if (w.sport === sport && w.date === date && trimmedTeams.includes((w.team || "").trim())) {
        if (w.type === "Fav" && favIndex === -1) favIndex = i;
        if (w.type === "Dog" && dogIndex === -1) dogIndex = i;
        if (favIndex !== -1 && dogIndex !== -1) break;
      }
    }
    if (favIndex === -1 || dogIndex === -1) {
      console.error("Did not find exactly 2 wagers for this team pair.");
      return res.status(400).json({ error: "Did not find exactly 2 wagers for this team pair." });
    }
    // Remove only those two indexes
    gameWagers = [pending[favIndex], pending[dogIndex]];
  } else {
    console.error("Missing search criteria:", { gameId, gameKey, sport, date, teams });
    return res.status(400).json({ error: "Missing gameId, gameKey, or sport/date/teams" });
  }

  console.log("Found game wagers:", gameWagers.length);
  console.log("Game wagers:", gameWagers);
  if (gameWagers.length < 2) {
    console.error("Not enough wagers found:", gameWagers.length);
    return res.status(400).json({ error: "Not enough wagers to settle (need at least 2)" });
  }

  // Separate all wagers into winners and losers
  const winnerWagers = gameWagers.filter((w) => w.team === winner.team);
  const loserWagers = gameWagers.filter((w) => w.team !== winner.team);

  if (winnerWagers.length === 0) {
    console.error("No wagers found for winning team:", winner.team);
    return res.status(400).json({ error: "No wagers found for the winning team" });
  }
  if (loserWagers.length === 0) {
    console.error("No wagers found for losing teams");
    return res.status(400).json({ error: "No wagers found for losing teams" });
  }
  // Remove only the exact pair for legacy wagers, and only the exact gameId for modern wagers
  if (gameId) {
    // For modern wagers, remove only wagers with the exact gameId
    console.log("Modern wager removal: gameId=", gameId);
    const toRemove = pending.filter((w) => w.gameId === gameId);
    console.log("Matched wagers to remove:", JSON.stringify(toRemove, null, 2));
    const newPending = pending.filter(
      (w) => w.gameId !== gameId
    );
    fs.writeFileSync(pendingPath, JSON.stringify(newPending, null, 2));
    console.log("Pending wagers AFTER removal:", JSON.stringify(newPending, null, 2));
  } else if (gameKey) {
    // For gameKey-based wagers
    console.log("GameKey wager removal: gameKey=", gameKey);
    const toRemove = pending.filter((w) => w.gameKey === gameKey);
    console.log("Matched wagers to remove:", JSON.stringify(toRemove, null, 2));
    const newPending = pending.filter(
      (w) => w.gameKey !== gameKey
    );
    fs.writeFileSync(pendingPath, JSON.stringify(newPending, null, 2));
    console.log("Pending wagers AFTER removal:", JSON.stringify(newPending, null, 2));
  } else {
    // For legacy wagers, find the first Fav and first Dog for the selected teams/date/sport and remove only those two by index
    const trimmedTeams = teams.map((t) => (t || "").trim());
    let favIndex = -1, dogIndex = -1;
    for (let i = 0; i < pending.length; i++) {
      const w = pending[i];
      if (
        w.sport === sport &&
        w.date === date &&
        trimmedTeams.includes((w.team || "").trim())
      ) {
        if (w.type === "Fav" && favIndex === -1) favIndex = i;
        if (w.type === "Dog" && dogIndex === -1) dogIndex = i;
        if (favIndex !== -1 && dogIndex !== -1) break;
      }
    }
    console.log("Legacy wager removal: favIndex=", favIndex, "dogIndex=", dogIndex);
    if (favIndex !== -1) console.log("Fav wager to remove:", JSON.stringify(pending[favIndex], null, 2));
    if (dogIndex !== -1) console.log("Dog wager to remove:", JSON.stringify(pending[dogIndex], null, 2));
    // Remove only those two indexes (highest first)
    const indexesToRemove = [favIndex, dogIndex].filter(idx => idx !== -1).sort((a, b) => b - a);
    indexesToRemove.forEach(idx => pending.splice(idx, 1));
    fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
    console.log("Pending wagers AFTER removal:", JSON.stringify(pending, null, 2));
  }
  
  // Add all settled wagers to settledWagers.json
  let settled = [];
  if (fs.existsSync(settledPath)) {
    settled = JSON.parse(fs.readFileSync(settledPath, "utf8"));
  }
  const now = new Date().toISOString();
  
  const settledEntries = [];
  
  // Add all winner wagers (positive amounts)
  winnerWagers.forEach(wager => {
    const entry = { ...wager, amount: Number(wager.toWin), settledAt: now, type: 'win' };
    settled.push(entry);
    settledEntries.push(entry);
  });
  
  // Add all loser wagers (negative amounts)
  loserWagers.forEach(wager => {
    const entry = { ...wager, amount: -Math.abs(Number(wager.risk)), settledAt: now, type: 'loss' };
    settled.push(entry);
    settledEntries.push(entry);
  });
  
  fs.writeFileSync(settledPath, JSON.stringify(settled, null, 2));
  
  // Add losing teams to deficits
  const deficitsPath = path.join(__dirname, "deficits.json");
  let deficits = [];
  if (fs.existsSync(deficitsPath)) {
    deficits = JSON.parse(fs.readFileSync(deficitsPath, "utf8"));
  }
  
  console.log("Current deficits before adding:", deficits.length);
  
  // For each losing wager, add to deficits
  loserWagers.forEach(wager => {
    const deficit = {
      team: wager.team,
      type: wager.type,
      risk: wager.risk,
      toWin: wager.toWin,
      deficit: Number(wager.risk), // The amount they lost becomes the deficit
      sport: wager.sport,
      date: wager.date,
      settledAt: now
    };
    deficits.push(deficit);
    console.log("Added deficit for team:", wager.team, "amount:", deficit.deficit);
  });
  
  fs.writeFileSync(deficitsPath, JSON.stringify(deficits, null, 2));
  console.log("Saved deficits file with", deficits.length, "total entries");
  
  console.log("Settlement successful!");
  console.log("Total settled entries:", settledEntries.length);
  console.log("Added", loserWagers.length, "losing teams to deficits");
  
  res.json({ 
    status: "success", 
    settled: settledEntries,
    winners: winnerWagers.length,
    losers: loserWagers.length,
    deficitsAdded: loserWagers.length
  });
});

// Reset settled wagers endpoint
app.delete("/api/settledWagers", (req, res) => {
  console.log("DELETE /api/settledWagers endpoint hit");
  console.log("Request method:", req.method);
  console.log("Request path:", req.path);
  const settledPath = path.join(__dirname, "settledWagers.json");
  
  try {
    console.log("Attempting to reset settled wagers at:", settledPath);
    // Write an empty array to the file
    fs.writeFileSync(settledPath, JSON.stringify([], null, 2));
    console.log("Successfully reset settled wagers");
    res.json({ status: "success", message: "Settled wagers reset successfully" });
  } catch (err) {
    console.error("Error resetting settled wagers:", err);
    res.status(500).json({ error: "Could not reset settled wagers" });
  }
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

