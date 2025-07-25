import React, { useState } from "react";

// Group wagers by gameId, with fallback to legacy grouping
function groupWagersByGame(wagers) {
  // Separate wagers with gameId from legacy wagers
  const wagersWithGameId = wagers.filter(w => w.gameId);
  const legacyWagers = wagers.filter(w => !w.gameId);
  
  const games = [];
  
  // Group wagers with gameId
  const gameIdGroups = {};
  wagersWithGameId.forEach(wager => {
    if (!gameIdGroups[wager.gameId]) {
      gameIdGroups[wager.gameId] = [];
    }
    gameIdGroups[wager.gameId].push(wager);
  });
  
  // Add complete games (both Fav and Dog) to results
  Object.values(gameIdGroups).forEach(group => {
    if (group.length === 2) {
      games.push(group);
    }
  });
  
  // Handle legacy wagers (old grouping by pairs)
  for (let i = 0; i < legacyWagers.length; i += 2) {
    const gameWagers = legacyWagers.slice(i, i + 2);
    if (gameWagers.length === 2) {
      games.push(gameWagers);
    }
  }
  
  return games;
}

const PendingWagers = ({ wagers, onLoss, onRefresh }) => {
  const [clicked, setClicked] = useState({});
  const [submitting, setSubmitting] = useState({});

  if (!wagers || wagers.length === 0) {
    return <div>No pending wagers.</div>;
  }

  // Calculate totals
  const totalRisked = wagers.reduce((sum, d) => sum + Number(d.risk || 0), 0);
  const totalToWin = wagers.reduce((sum, d) => sum + Number(d.toWin || 0), 0);
  const totalBalance = totalRisked;

  const grouped = groupWagersByGame(wagers);

  return (
    <div>
      <h3>Pending Wagers</h3>
      <div style={{ marginBottom: "12px", color: "#555" }}>
        Total Balance: $
        {totalBalance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        &nbsp;|&nbsp; Total Risked: $
        {totalRisked.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        &nbsp;|&nbsp; Total To Win: $
        {totalToWin.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div style={{ marginBottom: "12px", fontWeight: "bold" }}>
        Total Risked: $
        {totalRisked.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        &nbsp;|&nbsp; Total To Win: $
        {totalToWin.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      {grouped.map((gameWagers, idx) => {
        const favWager = gameWagers.find((w) => w.type === "Fav");
        const dogWager = gameWagers.find((w) => w.type === "Dog");
        const teams = [favWager?.team, dogWager?.team].filter(Boolean);
        const sport = favWager?.sport || dogWager?.sport || "";
        const date = favWager?.date || dogWager?.date || "";
        const gameTitle = teams.length === 2 ? `${teams.join(" vs ")}` : `${teams[0] || "Unknown"} (incomplete game)`;
        const gameKey = `${sport}:${teams.join("|")}:${date}:${idx}`;
        const selectedType = clicked[gameKey];
        const selectedWager =
          selectedType === "Fav"
            ? favWager
            : selectedType === "Dog"
              ? dogWager
              : null;

        return (
          <div
            key={gameKey + idx}
            style={{
              border: "2px solid #1976d2",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.07)",
              color: "#111",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {sport}: {gameTitle}
              {date ? ` (${date})` : ""}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {/* Fav Box */}
              <div
                style={{
                  flex: 1,
                  background: "#f9f9f9",
                  borderRadius: 6,
                  padding: 12,
                  border:
                    clicked[gameKey] === "Fav"
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#1976d2" }}>Fav</div>
                <div>
                  Team:{" "}
                  {favWager && favWager.team !== undefined && favWager.team !== null ? (
                    favWager.team || "Unknown"
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  Risk:{" "}
                  {favWager && favWager.risk !== undefined && favWager.risk !== null ? (
                    `$${favWager.risk}`
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  To Win:{" "}
                  {favWager && favWager.toWin !== undefined && favWager.toWin !== null ? (
                    `$${favWager.toWin}`
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  <input
                    type="radio"
                    name={`winner-${gameKey}`}
                    checked={clicked[gameKey] === "Fav"}
                    onChange={() => {
                      if (favWager)
                        setClicked((prev) => ({ ...prev, [gameKey]: "Fav" }));
                    }}
                    disabled={!favWager}
                  />{" "}
                  Select Winner
                </div>
              </div>
              {/* Dog Box */}
              <div
                style={{
                  flex: 1,
                  background: "#f9f9f9",
                  borderRadius: 6,
                  padding: 12,
                  border:
                    clicked[gameKey] === "Dog"
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#1976d2" }}>Dog</div>
                <div>
                  Team:{" "}
                  {dogWager && dogWager.team !== undefined && dogWager.team !== null ? (
                    dogWager.team || "Unknown"
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  Risk:{" "}
                  {dogWager && dogWager.risk !== undefined && dogWager.risk !== null ? (
                    `$${dogWager.risk}`
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  To Win:{" "}
                  {dogWager && dogWager.toWin !== undefined && dogWager.toWin !== null ? (
                    `$${dogWager.toWin}`
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  <input
                    type="radio"
                    name={`winner-${gameKey}`}
                    checked={clicked[gameKey] === "Dog"}
                    onChange={() => {
                      if (dogWager)
                        setClicked((prev) => ({ ...prev, [gameKey]: "Dog" }));
                    }}
                    disabled={!dogWager}
                  />{" "}
                  Select Winner
                </div>
              </div>
            </div>
            <button
              style={{
                marginTop: 16,
                padding: "8px 24px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor:
                  selectedWager && !submitting[gameKey]
                    ? "pointer"
                    : "not-allowed",
                opacity: selectedWager && !submitting[gameKey] ? 1 : 0.6,
                width: "100%",
              }}
              disabled={!selectedWager || submitting[gameKey]}
              onClick={async () => {
                if (!selectedWager) return;
                setSubmitting((prev) => ({ ...prev, [gameKey]: true }));

                // Use the new settleGame endpoint that handles multiple wagers
                try {
                  console.log("Attempting to settle game with teams:", gameWagers.map(w => w.team));
                  console.log("Selected winner:", selectedWager.team);
                  
                  const response = await fetch(`${import.meta.env.VITE_API_URL}/settleGame`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      winner: { team: selectedWager.team },
                      gameId: gameWagers[0]?.gameId, // Use gameId for precise matching
                      sport: gameWagers[0]?.sport,
                      date: gameWagers[0]?.date,
                      teams: gameWagers.map(w => w.team)
                    }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    console.log(`Settlement successful: ${result.winners} winners, ${result.losers} losers`);
                    
                    // Refresh the pending wagers list from the server
                    if (onRefresh) {
                      onRefresh();
                    }
                  } else {
                    console.error("Failed to settle game:", await response.text());
                    alert("Failed to settle game. Please try again.");
                  }
                } catch (error) {
                  console.error("Error settling game:", error);
                  alert("Error settling game. Please try again.");
                }

                setSubmitting((prev) => ({ ...prev, [gameKey]: false }));
              }}
            >
              Submit Winner
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PendingWagers;

