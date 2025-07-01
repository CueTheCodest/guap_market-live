import { useEffect, useState } from "react";

export function useSettledWins24h() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/settledWagers`)
      .then((res) => res.json())
      .then((data) => {
        const now = new Date();
        const last24h = data.filter(w => {
          if (!w.date) return false;
          // Accept both ISO and yyyy-mm-dd
          const wagerDate = new Date(w.date.length > 10 ? w.date : w.date + 'T00:00:00');
          return (now - wagerDate) < 24 * 60 * 60 * 1000;
        });
        setCount(last24h.length);
      })
      .catch(() => setCount(0));
  }, []);

  return count;
}
