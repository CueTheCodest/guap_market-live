import React, { useEffect, useState } from "react";

const DeficitsList = ({ onBack, onDeficitClick }) => {
  const [deficits, setDeficits] = useState([]);
  const [selected, setSelected] = useState([]);

  // Fetch deficits on mount
  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/deficits`;
    console.log("=== DEFICITS FETCH DEBUG ===");
    console.log("Fetching from URL:", url);
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    
    fetch(url)
      .then((res) => {
        console.log("Response status:", res.status);
        console.log("Response ok:", res.ok);
        return res.json();
      })
      .then((data) => {
        console.log("Raw data from server:", data);
        console.log("Deficit amounts in order:", data.map(d => `${d.team}: ${d.deficit}`));
        setDeficits(data);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setDeficits([]);
      });
  }, []);

  // Sort deficits by COMBINED amount (Risk + To Win), highest to lowest
  const sortedDeficits = [...deficits].sort((a, b) => {
    const combinedA = Number(a.risk || 0) + Number(a.toWin || 0);
    const combinedB = Number(b.risk || 0) + Number(b.toWin || 0);
    return combinedB - combinedA; // Highest first
  });

  // Map sorted indices back to original indices for deletion
  const getOriginalIndex = (sortedIdx) => {
    const sortedDeficit = sortedDeficits[sortedIdx];
    return deficits.findIndex(
      (d) =>
        d.team === sortedDeficit.team &&
        d.type === sortedDeficit.type &&
        d.risk === sortedDeficit.risk &&
        d.toWin === sortedDeficit.toWin &&
        d.deficit === sortedDeficit.deficit &&
        d.gameKey === sortedDeficit.gameKey,
    );
  };

  // Delete a single deficit by index
  const handleDelete = (sortedIdx) => {
    const originalIdx = getOriginalIndex(sortedIdx);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/deficits/${originalIdx}`, { // Remove /api/
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() =>
        setDeficits((deficits) => deficits.filter((_, i) => i !== originalIdx)),
      );
  };

  // Select/unselect for multi-delete
  const handleSelect = (sortedIdx) => {
    setSelected((prev) =>
      prev.includes(sortedIdx)
        ? prev.filter((i) => i !== sortedIdx)
        : [...prev, sortedIdx],
    );
  };

  // Delete selected deficits
  const handleDeleteSelected = () => {
    const originalIndices = selected.map(getOriginalIndex);
    Promise.all(
      originalIndices.map((idx) =>
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/deficits/${idx}`, { // Remove /api/
          method: "DELETE",
        }),
      ),
    ).then(() => {
      setDeficits((deficits) =>
        deficits.filter((_, i) => !originalIndices.includes(i)),
      );
      setSelected([]);
    });
  };

  // Delete all deficits
  const handleDeleteAll = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/deficits`, { method: "DELETE" }) // Remove /api/
      .then((res) => res.json())
      .then(() => {
        setDeficits([]);
        setSelected([]);
      });
  };

  const handleDeficitClick = (deficit, idx) => {
    // Calculate combined amount: risk + toWin and format to 2 decimal places
    const combinedAmount = Number(deficit.risk || 0) + Number(deficit.toWin || 0);
    const formattedAmount = Number(combinedAmount.toFixed(2));
    if (onDeficitClick) onDeficitClick(formattedAmount);
    handleDelete(idx);
  };

  return (
    <div>
      <h2 style={{ color: "gray" }}>Deficits</h2>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        Back
      </button>
      <button
        onClick={handleDeleteAll}
        style={{
          marginBottom: 16,
          marginLeft: 8,
          background: "#d32f2f",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "8px 16px",
        }}
        disabled={deficits.length === 0}
      >
        Delete All
      </button>
      <button
        onClick={handleDeleteSelected}
        style={{
          marginBottom: 16,
          marginLeft: 8,
          background: "#f57c00",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "8px 16px",
        }}
        disabled={selected.length === 0}
      >
        Delete Selected
      </button>
      {sortedDeficits.length === 0 ? (
        <div style={{ color: "red" }}>No deficits found.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sortedDeficits.map((deficit, idx) => (
            <li
              key={idx}
              style={{
                border: "1px solid #1976d2",
                borderRadius: 8,
                marginBottom: 12,
                padding: 12,
                background: "#fff",
                color: "red",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(idx)}
                  onChange={() => handleSelect(idx)}
                  style={{ marginRight: 8 }}
                  title="Select for multi-delete"
                />
                <b>Team:</b> {deficit.team} &nbsp;
                <b>Type:</b> {deficit.type} &nbsp;
                <b>Risk:</b> {deficit.risk} &nbsp;
                <b>To Win:</b> {deficit.toWin} &nbsp;
                <b>Deficit:</b>{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: "#1976d2",
                  }}
                  onClick={() => handleDeficitClick(deficit, idx)}
                  title="Click to use combined amount (Risk + To Win) for Dog To Win"
                >
                  {(Number(deficit.risk || 0) + Number(deficit.toWin || 0)).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(idx)}
                style={{
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  marginLeft: 16,
                }}
                title="Delete this deficit"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeficitsList;
