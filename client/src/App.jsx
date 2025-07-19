import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import BetScreen from "./BetScreen";
import PendingWagers from "./PendingWagers";
import DeficitsList from "./DeficitsList";
import SettledWagers from "./SettledWagers";
import { useSettledAmount24h } from "./useSettledAmount24h";
import SettledCalendar from "./SettledCalendar";

function App() {
  const [array, setArray] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [showPending, setShowPending] = useState(false);
  const [wagers, setWagers] = useState([]);
  const [losses, setLosses] = useState([]);
  const [showDeficits, setShowDeficits] = useState(false);
  const [dogToWin, setDogToWin] = useState(""); // <-- Add this line
  const [deficits, setDeficits] = useState([]);
  const [showPerDay, setShowPerDay] = useState(false);
  const [perDayAmount, setPerDayAmount] = useState("");
  const [teamCount, setTeamCount] = useState("");
  const [favToWin, setFavToWin] = useState(""); // <-- Add this line
  const [showSettled, setShowSettled] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const settledAmount24h = useSettledAmount24h();

  const fetchAPI = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}`);
    setArray(response.data.sports);
    console.log(response.data.sports);
  };

  useEffect(() => {
    console.log("fetchAPI function called");
    fetchAPI();
  }, []);

  // Add a function to load pending wagers from the server
  const loadPendingWagers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/pendingWagers`
      );
      setWagers(response.data);
    } catch (err) {
      setWagers([]);
    }
  };

  // Handler to add a wager to the pending wagers list
  const handlePlaceBet = async (wager) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/pendingWager`, wager);
      setWagers((prev) => [...prev, wager]);
      setSelectedSport(null);
      setShowPending(true); // Optionally show pending wagers after placing a bet
      setDogToWin(""); // Optionally clear Dog To Win after placing a bet
    } catch (err) {
      alert("Failed to save wager to server");
    }
  };

  const handleLoss = async (wager) => {
    // Remove both bets for the same game (Fav and Dog) from local state and server
    let gameWagers;
    if (wager.gameKey) {
      gameWagers = wagers.filter((w) => w.gameKey === wager.gameKey);
    } else {
      // fallback: match by sport, date, and both teams
      gameWagers = wagers.filter(
        (w) =>
          w.sport === wager.sport &&
          w.date === wager.date &&
          (w.type === "Fav" || w.type === "Dog")
      );
    }
    // Remove both from server using new endpoint
    try {
      if (wager.gameKey) {
        await fetch(`${import.meta.env.VITE_API_URL}/pendingWagers/game`, {
          method: "POST", // changed from DELETE to POST
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameKey: wager.gameKey }),
        });
      } else {
        // Trim team names to avoid mismatch due to spaces
        const teams = Array.from(new Set(gameWagers.map((w) => (w.team || "").trim())));
        await fetch(`${import.meta.env.VITE_API_URL}/pendingWagers/game`, {
          method: "POST", // changed from DELETE to POST
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sport: wager.sport,
            date: wager.date,
            teams,
          }),
        });
      }
    } catch (err) {
      // fallback: do nothing
    }
    // Remove both from local state
    if (wager.gameKey) {
      setWagers((prev) => prev.filter((w) => w.gameKey !== wager.gameKey));
    } else {
      setWagers((prev) =>
        prev.filter(
          (w) =>
            !(
              w.sport === wager.sport &&
              w.date === wager.date &&
              (w.type === "Fav" || w.type === "Dog")
            )
        )
      );
    }
    setLosses((prev) => [...prev, wager]);
    // Always refresh from server after a winner is selected
    setTimeout(() => {
      loadPendingWagers();
    }, 300);
  };

  // Fetch deficits from the server
  const loadDeficits = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/deficits`);
      setDeficits(response.data);
    } catch (err) {
      setDeficits([]);
    }
  };

  useEffect(() => {
    loadDeficits();
  }, []);

  // Calculate totals for pending wagers
  const totalRisked = wagers.reduce((sum, d) => sum + Number(d.risk || 0), 0);
  const totalToWin = wagers.reduce((sum, d) => sum + Number(d.toWin || 0), 0);
  // Calculate total deficits
  const totalDeficit = deficits.reduce((sum, d) => sum + Number(d.deficit || 0), 0);
  // Calculate net profit for settled button
  const netProfit = settledAmount24h - totalDeficit;

  return (
    <>
      <h1>Guap Market Live</h1>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowSettled(true)}
          style={{
            margin: 0,
            padding: '10px 20px',
            position: 'relative',
            background: netProfit >= 0 ? '#43a047' : '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            minWidth: 110,
          }}
        >
          Settled
          <span style={{
            display: 'block',
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: netProfit >= 0 ? '#43a047' : '#d32f2f',
            background: netProfit >= 0 ? '#e8f5e9' : '#ffebee',
            borderRadius: 8,
            padding: '2px 8px',
            marginTop: 4,
          }}>
            {netProfit === 0
              ? '$0.00'
              : netProfit > 0
                ? `$${netProfit.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`
                : `-$${Math.abs(netProfit).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`
            } (Net)
          </span>
        </button>
        <button
          onClick={() => {
            loadPendingWagers();
            setShowPending(true);
            setShowDeficits(false);
            setShowSettled(false);
          }}
          style={{ margin: 0, padding: '10px 20px', position: 'relative', minWidth: 110 }}
        >
          Pending
          <span style={{
            display: 'block',
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: '#1976d2',
            background: '#e3f2fd',
            borderRadius: 8,
            padding: '2px 8px',
            marginTop: 4,
          }}>
            ${totalRisked.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} / ${totalToWin.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </button>
        <button
          onClick={() => {
            setShowDeficits(true);
            setShowPending(false);
            setShowSettled(false);
          }}
          style={{ margin: 0, padding: '10px 20px', position: 'relative', minWidth: 110 }}
        >
          Deficits
          <span style={{
            display: 'block',
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: '#d32f2f',
            background: '#ffebee',
            borderRadius: 8,
            padding: '2px 8px',
            marginTop: 4,
          }}>
            ${totalDeficit.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}
          </span>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowPerDay(true)}
          style={{ margin: 0, padding: '10px 20px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', minWidth: 110 }}
        >
          Per Day
        </button>
        <button
          onClick={() => setShowCalendar(true)}
          style={{ margin: 0, padding: '10px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, minWidth: 110 }}
          title="Open Settled Calendar"
        >
          <span role="img" aria-label="calendar">📅</span>
        </button>
      </div>
      {showCalendar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 420, boxShadow: '0 4px 24px #0002', color: '#222', position: 'relative' }}>
            <button onClick={() => setShowCalendar(false)} style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
            <SettledCalendar />
          </div>
        </div>
      )}
      {showPerDay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, boxShadow: '0 4px 24px #0002', color: '#222', position: 'relative' }}>
            <button onClick={() => setShowPerDay(false)} style={{ position: 'absolute', top: 12, right: 12, background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
            <h2 style={{ color: '#43a047', marginBottom: 24 }}>Per Day Calculator</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold' }}>Team Count: </label>
              <input 
                type="number" 
                min={1} 
                value={teamCount} 
                placeholder="Enter team count"
                onChange={e => setTeamCount(e.target.value)} 
                style={{ width: 80, marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold' }}>Per Day Amount: </label>
              <input 
                type="number" 
                min={0} 
                value={perDayAmount} 
                placeholder="Enter amount"
                onChange={e => setPerDayAmount(e.target.value)} 
                style={{ width: 120, marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: 20, color: '#1976d2', marginTop: 24 }}>
              {(teamCount && perDayAmount && Number(teamCount) > 0 && Number(perDayAmount) >= 0) ? 
                `Result: $${(Number(perDayAmount) / Number(teamCount)).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} per team` : 
                'Enter team count and per day amount'}
            </div>
            <button
              style={{ marginTop: 24, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}
              disabled={!teamCount || !perDayAmount || Number(teamCount) <= 0 || Number(perDayAmount) < 0}
              onClick={() => {
                setFavToWin((Number(perDayAmount) / Number(teamCount)).toFixed(2));
                setShowPerDay(false);
              }}
            >Send to Fav To Win</button>
          </div>
        </div>
      )}
      <div className="card" style={{ marginBottom: "24px" }}>
        {array.map((sport, index) => (
          <button
            key={index}
            style={{ margin: "8px", padding: "10px 20px" }}
            onClick={() => {
              setSelectedSport(sport);
              setShowPending(false);
              setShowDeficits(false);
            }}
          >
            {sport}
          </button>
        ))}
      </div>
      {showSettled ? (
        <SettledWagers />
      ) : showDeficits ? (
        <DeficitsList
          onBack={() => setShowDeficits(false)}
          onDeficitClick={(amount) => {
            setDogToWin(amount);
            setShowDeficits(false); // Optionally close the list after click
            setShowPending(false);
            setSelectedSport("MLB"); // Optionally auto-select a sport, or remove this line
          }}
        />
      ) : showPending ? (
        <PendingWagers wagers={wagers} onLoss={handleLoss} />
      ) : selectedSport ? (
        <BetScreen
          sport={selectedSport}
          onBack={() => setSelectedSport(null)}
          onPlaceBet={handlePlaceBet}
          dogToWin={dogToWin}
          setDogToWin={setDogToWin}
          favToWin={favToWin}
          setFavToWin={setFavToWin}
        />
      ) : null}
    </>
  );
}

export default App;
