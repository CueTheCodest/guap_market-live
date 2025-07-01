import React, { useEffect, useState } from "react";

const SettledWagers = () => {
  const [settled, setSettled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/settledWagers`)
      .then((res) => res.json())
      .then((data) => {
        setSettled(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading settled wagers...</div>;
  if (!settled || settled.length === 0) return <div>No settled wagers.</div>;

  return (
    <div>
      <h3>Settled Wagers</h3>
      {settled.map((w, idx) => (
        <div key={idx} style={{
          border: "2px solid #43a047",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          background: "#f9fff9",
          color: "#222"
        }}>
          <div><b>Sport:</b> {w.sport}</div>
          <div><b>Team:</b> {w.team}</div>
          <div><b>Type:</b> {w.type}</div>
          <div><b>Risk:</b> {w.risk}</div>
          <div><b>To Win:</b> {w.toWin}</div>
          <div><b>Date:</b> {w.date}</div>
        </div>
      ))}
    </div>
  );
};

export default SettledWagers;
