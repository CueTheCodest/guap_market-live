import React, { useEffect, useState, useRef } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

function SettledCalendar() {
  const [settled, setSettled] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // null means calendar view
  const [zoomedDate, setZoomedDate] = useState(null); // for double-click zoom
  const calendarRef = useRef();

  useEffect(() => {
    let isMounted = true;
    function fetchSettled() {
      fetch(`${import.meta.env.VITE_API_URL}/settledWagers`)
        .then((res) => res.json())
        .then((data) => { if (isMounted) setSettled(data || []); });
    }
    fetchSettled();
    const interval = setInterval(fetchSettled, 3000); // Poll every 3 seconds
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Helper to safely get YYYY-MM-DD from a Date object or string
  function getDateString(dateObj) {
    if (!dateObj) return '';
    if (dateObj instanceof Date && !isNaN(dateObj)) return dateObj.toISOString().slice(0, 10);
    // If it's a string, try to parse as date
    const d = new Date(dateObj);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return '';
  }

  // Helper to format date as MM-DD-YYYY
  function formatDateMMDDYYYY(dateStr) {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${mm}/${dd}/${yyyy}`;
  }

  // Group settled wagers by settledAt date (or fallback to date)
  const wagersByDate = settled.reduce((acc, wager) => {
    const date = getDateString(wager.settledAt || wager.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(wager);
    return acc;
  }, {});

  // Calculate daily totals for each date
  const dailyTotals = Object.fromEntries(
    Object.entries(wagersByDate).map(([date, wagers]) => [
      date,
      {
        totalWagered: wagers.reduce((sum, w) => sum + Number(w.risk || 0), 0),
        totalToWin: wagers.reduce((sum, w) => sum + Number(w.toWin || 0), 0),
      },
    ])
  );

  // Show daily totals as badges on each calendar tile
  function tileContent({ date, view }) {
    if (view === 'month') {
      const dateStr = getDateString(date);
      const totals = dailyTotals[dateStr];
      if (totals) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2 }}>
            <span style={{ color: '#43a047', fontWeight: 'bold', fontSize: 16, lineHeight: 1, userSelect: 'none' }}>●</span>
            <span style={{ fontSize: 11, color: '#1976d2', background: '#e3f2fd', borderRadius: 6, padding: '0 4px', marginTop: 1 }}>
              ${totals.totalWagered.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#388e3c', background: '#e8f5e9', borderRadius: 6, padding: '0 4px', marginTop: 1 }}>
              ${totals.totalToWin.toFixed(1)}
            </span>
          </div>
        );
      }
    }
    return null;
  }

  // Remove long-press logic, use click to show details
  function CustomCalendar(props) {
    return (
      <Calendar
        {...props}
        onClickDay={date => {
          setZoomedDate(date);
          setSelectedDate(date);
          setTimeout(() => {
            if (calendarRef.current) {
              calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }}
        tileContent={tileContent}
      />
    );
  }

  // Show wagers for selected date
  const selectedDateStr = selectedDate ? getDateString(selectedDate) : null;
  const wagersForDay = selectedDateStr ? (wagersByDate[selectedDateStr] || []) : [];
  const totalsForDay = selectedDateStr ? dailyTotals[selectedDateStr] : null;

  return (
    <div style={{ padding: 12, minWidth: 0, width: '100%', maxWidth: 600, margin: '0 auto' }}>
      {/* Calendar icon as title */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 32, color: '#1976d2', marginRight: 8 }} role="img" aria-label="calendar">📅</span>
        <span style={{ fontWeight: 700, fontSize: 20, color: '#1976d2' }}>Settled Wagers</span>
      </div>
      {selectedDate === null ? (
        <div ref={calendarRef} style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <CustomCalendar
            onClickDay={setSelectedDate}
            tileContent={tileContent}
            prev2Label={null}
            next2Label={null}
          />
          {/* Show daily totals below calendar */}
          <div style={{ marginTop: 18 }}>
            {Object.entries(dailyTotals).map(([date, totals]) => (
              <div key={date} style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                <b>{formatDateMMDDYYYY(date)}:</b> Wagered: <b>${totals.totalWagered.toFixed(1)}</b> &nbsp;|&nbsp; To Win: <b>${totals.totalToWin.toFixed(1)}</b>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.15)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s',
            padding: 0,
          }}
          onClick={() => { setSelectedDate(null); setZoomedDate(null); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: zoomedDate ? 24 : 12,
              minWidth: 0,
              width: '95vw',
              maxWidth: 500,
              boxShadow: '0 4px 24px #0002',
              position: 'relative',
              transform: zoomedDate ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.3s, padding 0.3s, min-width 0.3s',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelectedDate(null); setZoomedDate(null); }}
              style={{
                marginBottom: 18,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                // Mobile responsive improvements
                maxWidth: '40vw',
                minWidth: 36,
                minHeight: 36,
                fontSize: 18,
                boxShadow: '0 2px 8px #1976d233',
              }}
            >
              ×
            </button>
            <div style={{ marginTop: 10 }}>
              <h3 style={{ color: '#43a047', marginBottom: 12, fontSize: 18 }}>Settled Wagers for {formatDateMMDDYYYY(selectedDateStr)}</h3>
              {totalsForDay && (
                <div style={{ marginBottom: 16, fontSize: 15, color: '#1976d2' }}>
                  <b>Total Wagered:</b> ${totalsForDay.totalWagered.toFixed(1)} &nbsp;|&nbsp; <b>Total To Win:</b> ${totalsForDay.totalToWin.toFixed(1)}
                </div>
              )}
              {wagersForDay.length === 0 ? (
                <div style={{ color: '#888', fontStyle: 'italic' }}>No settled wagers for this day.</div>
              ) : (
                <div>
                  {wagersForDay.map((w, i) => (
                    <div className="settled-wager-card" key={i}>
                      <div style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 15 }}>{w.sport} - {w.team} <span style={{ color: '#888', fontWeight: 'normal' }}>({w.type || (w.amount > 0 ? 'win' : 'loss')})</span></div>
                      <div style={{ fontSize: 14 }}>Risk: <b>${w.risk}</b> &nbsp;|&nbsp; To Win: <b>${w.toWin}</b></div>
                      <div style={{ fontSize: 14 }}>
                        Result: <b style={{ color: w.amount > 0 ? '#43a047' : '#d32f2f' }}>{w.amount > 0 ? '+' : ''}${w.amount}</b>
                      </div>
                      {w.gameKey && <div style={{ fontSize: 12, color: '#888' }}>Game Key: {w.gameKey}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .react-calendar__tile {
          position: relative;
        }
        .react-calendar__tile abbr {
          font-size: 1.15em;
          font-weight: bold;
          color: #222;
        }
        @media (max-width: 600px) {
          .react-calendar {
            width: 100vw !important;
            min-width: 0 !important;
            font-size: 15px !important;
          }
          .settled-wager-card {
            font-size: 13px !important;
            padding: 10px 8px !important;
          }
          .react-calendar__tile {
            min-height: 44px !important;
            padding: 2px 0 !important;
          }
          .react-calendar__month-view {
            padding: 0 2px !important;
          }
          .react-calendar__navigation button {
            min-width: 32px !important;
            font-size: 1em !important;
          }
          h3 {
            font-size: 1.1em !important;
          }
          /* Ensure close button is always visible */
          button[style*='position: absolute'] {
            top: 8px !important;
            right: 8px !important;
            z-index: 10 !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 18px !important;
            padding: 6px 10px !important;
          }
        }
        .calendar-selected-day {
          background: #1976d2 !important;
          color: #fff !important;
          border-radius: 50% !important;
        }
        .calendar-zoomed-day {
          background: #43a047 !important;
          color: #fff !important;
          border-radius: 50% !important;
          box-shadow: 0 0 0 4px #43a04733;
        }
        .settled-wager-card {
          background: #f5f5f5;
          border-radius: 8px;
          box-shadow: 0 2px 8px #0001;
          padding: 14px 18px;
          margin-bottom: 12px;
          transition: box-shadow 0.2s;
        }
        .settled-wager-card:hover {
          box-shadow: 0 4px 16px #1976d233;
        }
      `}</style>
    </div>
  );
}

export default SettledCalendar;
