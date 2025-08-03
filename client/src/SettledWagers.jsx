import React, { useEffect, useState } from "react";

const SettledWagers = ({ onReset }) => {
  const [settled, setSettled] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettledWagers = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/settledWagers`)
      .then((res) => res.json())
      .then((data) => {
        setSettled(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettledWagers();
  }, []);

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all settled wagers? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settledWagers`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSettled([]);
        if (onReset) {
          onReset(); // Refresh the settled amount in the parent component
        }
        alert("Settled wagers have been reset successfully.");
      } else {
        alert("Failed to reset settled wagers. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting settled wagers:", error);
      alert("An error occurred while resetting settled wagers.");
    }
  };

  // Helper to format date as MM/DD/YYYY
  function formatDateMMDDYYYY(dateStr) {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${mm}/${dd}/${yyyy}`;
  }

  // Helper to get sport icon
  const getSportIcon = (sport) => {
    switch (sport?.toUpperCase()) {
      case 'NBA':
      case 'WNBA':
        return '🏀'; // Basketball for both NBA and WNBA
      case 'MLB':
        return '⚾'; // Baseball
      case 'NFL':
        return '🏈'; // Football
      case 'NHL':
        return '🏒'; // Hockey
      default:
        return '🎲'; // Default dice icon
    }
  };

  if (loading) return <div>Loading settled wagers...</div>;

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: 16,
      background: 'linear-gradient(135deg, #e0f7fa 0%, #f9fff9 100%)',
      borderRadius: 16,
      boxShadow: '0 4px 24px #0002',
      fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    }}>
      <h3 style={{
        color: '#1976d2',
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: 1,
        marginBottom: 24,
        textAlign: 'center',
        textShadow: '0 2px 8px #1976d233',
      }}>Settled Wagers</h3>
      
      {settled.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <button
            onClick={handleReset}
            style={{
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 14,
              boxShadow: '0 2px 8px #d32f2f33',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.target.style.background = '#c62828'}
            onMouseOut={(e) => e.target.style.background = '#d32f2f'}
          >
            Reset All Settled Wagers
          </button>
        </div>
      )}
      
      {settled.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: 16, padding: 40 }}>
          No settled wagers found.
        </div>
      )}
      
      {settled.length > 0 && (
        <div>
          {settled.map((w, idx) => (
            <div key={idx} style={{
              border: 'none',
              borderRadius: 12,
              padding: 18,
              marginBottom: 18,
              background: 'rgba(255,255,255,0.95)',
              color: '#222',
              boxShadow: '0 2px 12px #1976d222',
              transition: 'box-shadow 0.2s',
              position: 'relative',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 8,
                gap: 8,
              }}>
                <span style={{
                  background: '#43a047',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: '0 2px 8px #43a04733',
                }}>{getSportIcon(w.sport)}</span>
                <span style={{ fontWeight: 600, fontSize: 18, color: '#1976d2' }}>{w.sport}</span>
                <span style={{ fontSize: 13, color: '#888', fontWeight: 400, marginLeft: 6 }}>{w.type}</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 4 }}>
                {w.team}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 15, marginBottom: 4 }}>
                <span><b>Risk:</b> <span style={{ color: '#d32f2f' }}>${w.risk || 'N/A'}</span></span>
                <span><b>To Win:</b> <span style={{ color: '#43a047' }}>${w.toWin || 'N/A'}</span></span>
              </div>
              <div style={{ fontSize: 14, color: '#555', marginBottom: 2 }}>
                <b>Date:</b> {formatDateMMDDYYYY(w.date)}
              </div>
              {/* Show settlement type and date if available */}
              {w.settledAt && (
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  <b>Settled:</b> {w.type} on {new Date(w.settledAt).toLocaleDateString()}
                </div>
              )}
              {/* Only show amount if it exists */}
              {w.amount !== undefined && (
                <div style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  fontWeight: 700,
                  color: w.amount > 0 ? '#43a047' : '#d32f2f',
                  fontSize: 18,
                  background: w.amount > 0 ? '#e8f5e9' : '#ffebee',
                  borderRadius: 8,
                  padding: '2px 10px',
                  boxShadow: '0 2px 8px #0001',
                }}>
                  {w.amount > 0 ? '+' : ''}${w.amount}
                </div>
              )}
              {/* Show legacy data indicator if no amount */}
              {w.amount === undefined && (
                <div style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  fontWeight: 500,
                  color: '#757575',
                  fontSize: 12,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: '4px 8px',
                  boxShadow: '0 1px 4px #0001',
                }}>
                  Legacy
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettledWagers;
