import React, { useEffect, useState } from "react";

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const BetScreen = ({ sport, onBack, onPlaceBet, dogToWin, setDogToWin }) => {
  const [favTeam, setFavTeam] = useState("");
  const [dogTeam, setDogTeam] = useState("");
  const [favRisk, setFavRisk] = useState("");
  const [favToWin, setFavToWin] = useState("");
  const [dogRisk, setDogRisk] = useState("");
  const [date, setDate] = useState(getToday());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!favTeam || !dogTeam || !favRisk || !favToWin || !dogRisk || !dogToWin || !date) return;
    // Place Fav bet
    onPlaceBet({
      sport,
      team: favTeam,
      type: "Fav",
      risk: favRisk,
      toWin: favToWin,
      date,
    });
    // Place Dog bet
    onPlaceBet({
      sport,
      team: dogTeam,
      type: "Dog",
      risk: dogRisk,
      toWin: dogToWin,
      date,
    });
    setFavTeam("");
    setDogTeam("");
    setFavRisk("");
    setFavToWin("");
    setDogRisk("");
    setDogToWin("");
    setDate(getToday());
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24, background: "#f5faff", borderRadius: 8, color: "#111", boxShadow: "0 2px 8px rgba(25, 118, 210, 0.07)" }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>Back</button>
      <h2>Place a Bet - {sport}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ flex: 2 }}>
            Fav Team:{" "}
            <input
              type="text"
              value={favTeam}
              onChange={e => setFavTeam(e.target.value)}
              required
              style={{ width: "100%" }}
              placeholder="Favorite team"
            />
          </label>
          <label style={{ flex: 1 }}>
            Risk:{" "}
            <input
              type="number"
              value={favRisk}
              onChange={e => {
               const val = e.target.value;
               if (/^\d*\.?\d{0,2}$/.test(val)) setFavRisk(val);
              }}
              required
              min="0"
              step="0.01"
              style={{ width: "80px" }}
            />
          </label>
          <label style={{ flex: 1 }}>
            To Win:
            <input
              type="number"
              value={favToWin}
              onChange={e => {
               const val = e.target.value;
               if (/^\d*\.?\d{0,2}$/.test(val)) setFavToWin(val);
              }}
              required
              min="0"
              step="0.01"
              style={{ width: "80px" }}
          />
          </label>
        </div>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ flex: 2 }}>
            Dog Team:{" "}
            <input
              type="text"
              value={dogTeam}
              onChange={e => setDogTeam(e.target.value)}
              required
              style={{ width: "100%" }}
              placeholder="Underdog team"
            />
          </label>
          <label style={{ flex: 1 }}>
            Risk:{" "}
            <input
              type="number"
              value={dogRisk}
              onChange={e => {
               const val = e.target.value;
               if (/^\d*\.?\d{0,2}$/.test(val)) setDogRisk(val);
              }}
              required
              min="0"
              step="0.01"
              style={{ width: "80px" }}
            />
          </label>
          <label style={{ flex: 1 }}>
            To Win:{" "}
            <input
              type="number"
              value={dogToWin}
              onChange={e => {
               const val = e.target.value;
               if (/^\d*\.?\d{0,2}$/.test(val)) setDogToWin(val);
              }}
              required
              min="0"
              step="0.01"
              style={{ width: "80px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Date:{" "}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </label>
        </div>
        <button type="submit" style={{ padding: "8px 20px" }}>Run It</button>
      </form>
    </div>
  );
};

export default BetScreen;