import React from "react";

// DeficitPage: shows all lost wagers and the total deficit
export function DeficitPage({ losses }) {
  const totalDeficit = losses.reduce((sum, loss) => sum + Number(loss.risk || 0), 0);

  return (
    <div>
      <h3>Deficit Page</h3>
      <div style={{ marginBottom: "12px", fontWeight: "bold" }}>
        Total Deficit: ${totalDeficit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Sport</th>
            <th>Type</th>
            <th>Team</th>
            <th>Risk</th>
            <th>To Win</th>
          </tr>
        </thead>
        <tbody>
          {losses.map((loss, idx) => (
            <tr key={idx} style={{ color: "red" }}>
              <td>{loss.sport}</td>
              <td>{loss.type}</td>
              <td>{loss.team}</td>
              <td>{loss.risk}</td>
              <td>{loss.toWin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// PendingWagersWithLoss: wraps PendingWagers and handles marking losses
export function PendingWagersWithLoss({ wagers, onLoss }) {
  // Helper to group wagers by sport and teams
  function groupWagersByGame(wagers) {
    const games = {};
    wagers.forEach(wager => {
      const key =
        wager.sport +
        ":" +
        (wager.type === "Fav"
          ? `${wager.team}|${wagers.find(
              w => w.sport === wager.sport && w.type === "Dog" && w.team !== wager.team
            )?.team || ""}`
          : `${wagers.find(
              w => w.sport === wager.sport && w.type === "Fav" && w.team !== wager.team
            )?.team || ""}|${wager.team}`);
      if (!games[key]) games[key] = [];
      games[key].push(wager);
    });
    return games;
  }

  if (!wagers || wagers.length === 0) {
    return <div>No pending wagers.</div>;
  }

  const grouped = groupWagersByGame(wagers);

  return (
    <div>
      <h3>Pending Wagers</h3>
      {Object.entries(grouped).map(([gameKey, gameWagers]) => (
        <div
          key={gameKey}
          style={{
            border: "2px solid #1976d2",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            background: "#f5faff",
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.07)",
            color: "#111"
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            {gameWagers[0].sport}: {gameWagers.map(w => w.team).join(" vs ")}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Team</th>
                <th>Risk</th>
                <th>To Win</th>
                <th>Mark Loss</th>
              </tr>
            </thead>
            <tbody>
              {gameWagers.map((wager, i) => (
                <tr key={i}>
                  <td>{wager.type}</td>
                  <td>{wager.team}</td>
                  <td>{wager.risk}</td>
                  <td>{wager.toWin}</td>
                  <td>
                    <button
                      style={{
                        color: "white",
                        background: "red",
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => onLoss(wager)}
                    >
                      Mark Loss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
            ))}
          </div>
        );
      }
        