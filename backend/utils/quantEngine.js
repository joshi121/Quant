/**
 * Simplified Financial Engine
 * Uses 3 transparent, standard financial formulas:
 * 1. News Impact Factor = Sentiment Score * (Severity % / 100)
 * 2. 50-Day Trend % = ((Current Price - SMA50) / SMA50) * 100
 * 3. Projected Drift % = (News Impact * Beta * 5.0) + (0.5 * Trend %)
 */

/**
 * 1. News Impact Factor (N)
 * Combines sentiment (-1.0 to +1.0) and severity (0-100%) into a directional impact factor.
 */
export const calculateNewsImpact = (sentimentScore, severityRating) => {
  const sentiment = Math.max(-1, Math.min(1, sentimentScore || 0));
  const severity = Math.max(0, Math.min(100, severityRating || 50)) / 100;
  return parseFloat((sentiment * severity).toFixed(4));
};

/**
 * 2. 50-Day Trend Momentum % (T%)
 * Calculates percentage distance of current price relative to 50-day moving average.
 */
export const calculateTrendPercent = (currentPrice, sma50) => {
  if (!sma50 || sma50 <= 0 || !currentPrice) return 0;
  const trend = ((currentPrice - sma50) / sma50) * 100;
  return parseFloat(trend.toFixed(2));
};

/**
 * 3. Projected Price Drift % & Target Price
 * Combines stock volatility (Beta), News Impact, and 50-day Trend Momentum.
 */
export const calculateProjectedDrift = (newsImpact, beta, trendPercent, currentPrice) => {
  const safeBeta = Math.max(0.2, beta || 1.0);
  const price = currentPrice || 100;

  // News impact scaled by Beta + 50% weight of existing trend momentum
  const percentDrift = (newsImpact * safeBeta * 5.0) + (0.5 * trendPercent);
  const targetPrice = price * (1 + (percentDrift / 100));

  return {
    percentDrift: parseFloat(percentDrift.toFixed(2)),
    targetPrice: parseFloat(targetPrice.toFixed(2))
  };
};

/**
 * 4. Trajectory Signal Classifier
 */
export const classifyTrajectory = (percentDrift) => {
  if (percentDrift >= 1.0) return "BULLISH";
  if (percentDrift <= -1.0) return "BEARISH";
  return "NEUTRAL";
};

/**
 * 5. Complete Simplified Quant Analysis Pipeline
 */
export const runQuantAnalysisPipeline = ({
  ticker,
  companyName,
  severityRating,
  sentimentScore,
  currentPrice,
  beta,
  sma50,
  orderType = "First-Order (Direct)"
}) => {
  const newsImpact = calculateNewsImpact(sentimentScore, severityRating);
  const trendPercent = calculateTrendPercent(currentPrice, sma50);
  const { percentDrift, targetPrice } = calculateProjectedDrift(newsImpact, beta, trendPercent, currentPrice);
  const trajectory = classifyTrajectory(percentDrift);

  return {
    ticker,
    companyName: companyName || ticker,
    currentPrice: parseFloat((currentPrice || 0).toFixed(2)),
    beta: parseFloat((beta || 1.0).toFixed(2)),
    sma50: parseFloat((sma50 || 0).toFixed(2)),
    newsImpact,
    trendPercent,
    percentDrift,
    targetPrice,
    trajectory,
    orderType
  };
};
