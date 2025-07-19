import { useEffect, useState } from "react";

export function useSettledAmount24h(refreshTrigger = 0) {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/settledWagers`).then((res) => res.json()),
      fetch(`${import.meta.env.VITE_API_URL}/deficits`).then((res) => res.json()),
    ])
      .then(([settled, deficits]) => {
        const now = new Date();
        let total = 0;
        
        // Add all settled amounts (wins are positive, losses are negative)
        settled.forEach(w => {
          if (!w.date) return;
          const wagerDate = new Date(w.date.length > 10 ? w.date : w.date + 'T00:00:00');
          if ((now - wagerDate) < 24 * 60 * 60 * 1000) {
            // Use the amount field if available (from /api/settleGame), otherwise fallback to old logic
            if (w.amount !== undefined) {
              const amount = Number(w.amount);
              total += isNaN(amount) ? 0 : amount;
            } else {
              // Fallback for legacy data without amount field
              const toWin = Number(w.toWin);
              total += isNaN(toWin) ? 0 : toWin;
            }
          }
        });
        
        // Subtract all deficits for last 24h (only if we're using legacy data)
        const hasAmountField = settled.some(w => w.amount !== undefined);
        if (!hasAmountField) {
          deficits.forEach(d => {
            if (!d.date) return;
            const deficitDate = new Date(d.date.length > 10 ? d.date : d.date + 'T00:00:00');
            if ((now - deficitDate) < 24 * 60 * 60 * 1000) {
              const deficit = Number(d.deficit);
              total -= isNaN(deficit) ? 0 : deficit;
            }
          });
        }
        
        setAmount(total);
      })
      .catch(() => setAmount(0));
  }, [refreshTrigger]);

  return amount;
}
