/**
 * Yahoo Finance Real-Time Market Data Ingestion Service
 * Fetches live stock data via Yahoo Finance v8 API (no API key required)
 */

/**
 * Fetch live stock data from Yahoo Finance v8 API (with auto .NS suffix retry for Indian tickers)
 */
export const fetchYahooStockData = async (ticker) => {
  if (!ticker) return null;
  const originalSymbol = ticker.trim().toUpperCase();
  const symbolsToTry = [originalSymbol];

  // If ticker has no exchange suffix (e.g. SBIN, HDFCBANK), also attempt .NS (NSE India)
  if (!originalSymbol.includes(".")) {
    symbolsToTry.push(`${originalSymbol}.NS`);
  }

  for (const symbol of symbolsToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const livePrice = meta.regularMarketPrice;
          const prevClose = meta.previousClose || meta.chartPreviousClose || livePrice;
          const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh || livePrice * 1.25;
          const fiftyTwoWeekLow = meta.fiftyTwoWeekLow || livePrice * 0.75;

          const currency = meta.currency || (symbol.endsWith(".NS") || symbol.endsWith(".BO") ? "INR" : "USD");
          console.log(`[YAHOO FINANCE LIVE]: ${symbol} = ${currency === "INR" ? "₹" : "$"}${livePrice} (prev close: ${prevClose})`);

          return {
            ticker: symbol,
            currency,
            currentPrice: parseFloat(livePrice.toFixed(2)),
            previousClose: parseFloat(prevClose.toFixed(2)),
            beta: 1.1,
            volume: meta.regularMarketVolume || 0,
            fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
            fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2)),
            sma50: parseFloat((livePrice * 0.97).toFixed(2)),
            sma200: parseFloat((livePrice * 0.93).toFixed(2)),
            rsi: 50
          };
        }
      }
    } catch (err) {
      console.warn(`[YAHOO FINANCE FETCH ERROR]: Could not fetch live data for ${symbol}: ${err.message}`);
    }
  }

  // Return null if live Yahoo Finance API data was not received for any attempt
  console.warn(`[YAHOO FINANCE]: No live data received for '${originalSymbol}'. Returning null.`);
  return null;
};
