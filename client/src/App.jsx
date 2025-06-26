import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import BetScreen from "./BetScreen";
import PendingWagers from "./PendingWagers";
import DeficitsList from "./DeficitsList";

function App() {
  const [array, setArray] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [showPending, setShowPending] = useState(false);
  const [wagers, setWagers] = useState([]);
  const [losses, setLosses] = useState([]);
  const [showDeficits, setShowDeficits] = useState(false);
  const [dogToWin, setDogToWin] = useState(""); // <-- Add this line

  const fetchAPI = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}`);
    setArray(response.data.sports);
    console.log(response.data.sports);
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  // Handler to add a wager to the pending wagers list
  const handlePlaceBet = (wager) => {
    setWagers((prev) => [...prev, wager]);
    setSelectedSport(null);
    setShowPending(true); // Optionally show pending wagers after placing a bet
    setDogToWin(""); // Optionally clear Dog To Win after placing a bet
  };

  const handleLoss = (wager) => {
    setWagers((prev) => prev.filter((w) => w !== wager));
    setLosses((prev) => [...prev, wager]);
  };

  return (
    <>
      <h1>Guap Market Live</h1>
      <button
        onClick={() => {
          setShowPending(true);
          setShowDeficits(false);
        }}
        style={{ margin: "8px", padding: "10px 20px" }}
      >
        Pending
      </button>
      <button
        onClick={() => {
          setShowDeficits(true);
          setShowPending(false);
          setSelectedSport(null);
        }}
        style={{ margin: "8px", padding: "10px 20px" }}
      >
        Deficits
      </button>
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
      {showDeficits ? (
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
        />
      ) : null}
    </>
  );
}

export default App;

