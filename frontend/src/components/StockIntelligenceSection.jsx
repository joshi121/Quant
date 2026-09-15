import React, { useState, useEffect } from "react";
import { getStockIntelligence, deleteStockAnalysis } from "../services/stockService.js";

const StockIntelligenceSection = () => {
  const [stockNewsList, setStockNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // ALL, BULLISH, BEARISH

  const fetchStockIntelligence = async () => {
    try {
      setLoading(true);
      const res = await getStockIntelligence();
      setStockNewsList(res.data || []);
    } catch (err) {
      console.error("Error fetching stock intelligence feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStockAnalysis = async (newsId) => {
    try {
      await deleteStockAnalysis(newsId);
      setStockNewsList((prev) => prev.filter((item) => String(item._id || item.newsId) !== String(newsId)));
    } catch (err) {
      console.error("Error deleting stock analysis report:", err);
    }
  };

  useEffect(() => {
    fetchStockIntelligence();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTrajectoryBadge = (trajectory) => {
    switch (trajectory) {
      case "BULLISH":
      case "BULLISH_SURGE":
        return <span className="bg-emerald-500 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 shadow-sm">🟢 BULLISH</span>;
      case "BEARISH":
      case "BEARISH_DIP":
        return <span className="bg-rose-600 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 shadow-sm">🔴 BEARISH</span>;
      default:
        return <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">⚪ NEUTRAL</span>;
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📈</span> Stock Intelligence & Quant Radar
            </h1>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
              SIMPLE QUANT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time news sentiment, Yahoo Finance metrics, and simplified stock trajectory prediction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              selectedFilter === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Analyzed ({stockNewsList.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        </div>
      ) : stockNewsList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">No news stories analyzed for stock trajectory yet.</p>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Click the <b>📊 Analyze Stock Impact</b> button on any article card in the <b>24h News Feed</b> or <b>Bookmarks</b> tab to trigger the AI & Quant Analysis Engine!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {stockNewsList.map((item) => {
            const analysis = item.stockAnalysis || {};
            const isLow = analysis.isLowImpact;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                {/* News Headline & Meta Header */}
                <div className="flex items-start justify-between gap-4 mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {analysis.primarySector || item.category || "Market"}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Impact Severity Rating: <b className="text-slate-800">{analysis.severityRating || 0}%</b>
                      </span>
                      <span className="text-xs text-slate-400">
                        • Analyzed {formatTime(analysis.analyzedAt || item.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteStockAnalysis(item._id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1 transition-all"
                      title="Delete Stock Analysis Report"
                    >
                      Delete Report
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1"
                    >
                      Read Story ↗
                    </a>
                  </div>
                </div>

                {/* Low Impact Guardrail Message */}
                {isLow ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-3">
                    <span className="text-lg">ℹ️</span>
                    <div>
                      <p className="font-bold">{analysis.lowImpactMessage}</p>
                      <p className="text-amber-700 text-[11px] mt-0.5">{analysis.aiExecutiveBriefing}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* 2-Sentence Actionable Trade Briefing Box */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 mb-4 shadow-md border border-indigo-900">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-900/80">
                        <span className="text-[10px] font-extrabold text-indigo-300 tracking-wider uppercase flex items-center gap-1.5">
                          ⚡ ACTIONABLE TRADE BRIEFING:
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-100 font-bold tracking-wide">
                        {analysis.aiExecutiveBriefing}
                      </p>
                    </div>

                    {/* Stock Tickers & Quant Formulas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(analysis.stocks || []).map((stk) => {
                        const getCurrencySymbol = (currency) => {
                          if (currency === "INR") return "₹";
                          if (currency === "EUR") return "€";
                          if (currency === "GBP") return "£";
                          if (currency === "JPY") return "¥";
                          return "$";
                        };

                        const symbol = getCurrencySymbol(stk.currency);

                        return (
                          <div
                            key={stk.ticker}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="text-sm font-extrabold text-slate-900">{stk.ticker}</span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                                    {stk.companyName}
                                  </span>
                                </div>
                                {getTrajectoryBadge(stk.trajectory)}
                              </div>

                              {/* Live Price & Beta */}
                              <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-100 text-xs mb-2.5">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">LIVE PRICE</span>
                                  <span className="font-bold text-slate-800">{symbol}{stk.currentPrice}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-medium">BETA (β)</span>
                                  <span className="font-bold text-slate-800">{stk.beta}</span>
                                </div>
                              </div>

                              {/* Simple Quant Formulas: News Impact & 50-Day Trend */}
                              <div className="space-y-1 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 mb-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">News Impact Factor:</span>
                                  <span className="font-bold text-slate-700">{stk.newsImpact ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">50-Day Trend:</span>
                                  <span className={`font-bold ${(stk.trendPercent || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {(stk.trendPercent || 0) >= 0 ? "+" : ""}{stk.trendPercent ?? 0}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                                  <span className="text-slate-700 font-semibold">Target Price (Drift):</span>
                                  <span className={`font-extrabold ${(stk.percentDrift || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {symbol}{stk.targetPrice || stk.currentPrice} ({(stk.percentDrift || 0) >= 0 ? "+" : ""}{stk.percentDrift ?? 0}%)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-400 font-medium italic text-right pt-1 border-t border-slate-200">
                              {stk.orderType || "First-Order Impact"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockIntelligenceSection;
