import yahooFinance from "yahoo-finance2";

export const getIndices = async (req, res) => {
  try {
    const symbols = [
      { name: "NIFTY 50", symbol: "^NSEI" },
      { name: "SENSEX", symbol: "^BSESN" },
      { name: "NASDAQ", symbol: "^IXIC" },
      { name: "DOW JONES", symbol: "^DJI" },
    ];

    const results = await Promise.all(
      symbols.map(async (s) => {
        try {
          const quote = await yahooFinance.quote(s.symbol);

          return {
            name: s.name,
            symbol: s.symbol,
            price: quote.regularMarketPrice ?? null,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            lastTradingDay: quote.regularMarketTime ?? null,
          };
        } catch (err) {
          return {
            name: s.name,
            symbol: s.symbol,
            price: null,
            change: 0,
            changePercent: 0,
            error: "Failed to fetch",
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching indices:", err.message);
    res.status(500).json({ error: "Failed to fetch index data" });
  }
};
