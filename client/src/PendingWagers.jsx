import React, { useState, useEffect } from "react";

// Group wagers by order submitted: every two wagers (Fav and Dog) are a game box
function groupWagersBySubmission(wagers) {
  const games = [];
  for (let i = 0; i < wagers.length; i += 2) {
    // Each game is an array of up to two wagers (Fav and Dog)
    games.push(wagers.slice(i, i + 2));
  }
  return games;
}

const PendingWagers = ({ wagers, onLoss }) => {
  const [clicked, setClicked] = useState({});
  const [submitting, setSubmitting] = useState({});

  if (!wagers || wagers.length === 0) {
    return <div>No pending wagers.</div>;
  }

  // Calculate totals
  const totalRisked = wagers.reduce((sum, d) => sum + Number(d.risk || 0), 0);
  const totalToWin = wagers.reduce((sum, d) => sum + Number(d.toWin || 0), 0);
  const totalBalance = totalRisked;

  const grouped = groupWagersBySubmission(wagers);

  // Helper to remove all wagers for a game from pending
  const removeGameFromPending = (gameWagers) => {
    gameWagers.forEach((w) => {
      if (onLoss) onLoss(w);
    });
  };

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
        const gameKey = `${favWager?.sport || dogWager?.sport || ""}:${teams.join("|")}:${favWager?.date || dogWager?.date || ""}`;
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
              {favWager?.sport || dogWager?.sport || ""}: {teams.join(" vs ")}
              {favWager?.date || dogWager?.date
                ? ` (${favWager?.date || dogWager?.date})`
                : ""}
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
                  {favWager ? (
                    favWager.team
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  Risk:{" "}
                  {favWager ? (
                    favWager.risk
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  To Win:{" "}
                  {favWager ? (
                    favWager.toWin
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
                  {dogWager ? (
                    dogWager.team
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  Risk:{" "}
                  {dogWager ? (
                    dogWager.risk
                  ) : (
                    <span style={{ color: "#aaa" }}>N/A</span>
                  )}
                </div>
                <div>
                  To Win:{" "}
                  {dogWager ? (
                    dogWager.toWin
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
              onClick={() => {
                if (!selectedWager) return;
                setSubmitting((prev) => ({ ...prev, [gameKey]: true }));

                // Find the losing wager (the one not selected)
                const loserWager = selectedType === "Fav" ? dogWager : favWager;

                // Only submit the loser to the backend
                if (loserWager) {
                  fetch(`${import.meta.env.VITE_API_URL}/deficit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      team: loserWager.team,
                      type: loserWager.type,
                      risk: loserWager.risk,
                      toWin: loserWager.toWin,
                      deficit:
                        Number(loserWager.risk || 0) +
                        Number(loserWager.toWin || 0),
                      gameKey,
                    }),
                  })
                    .then((res) => res.json())
                    .then(() => {
                      removeGameFromPending(gameWagers);
                    })
                    .catch((err) => {
                      alert("Error saving deficit");
                    })
                    .finally(() => {
                      setSubmitting((prev) => ({ ...prev, [gameKey]: false }));
                    });
                } else {
                  // If there is no loser (shouldn't happen), just remove from pending
                  removeGameFromPending(gameWagers);
                  setSubmitting((prev) => ({ ...prev, [gameKey]: false }));
                }
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

