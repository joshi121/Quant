import React, { useState, useEffect } from "react";
import { getNews, summarizeNews, syncNews } from "../services/newsService.js";
import { analyzeStock } from "../services/stockService.js";
import { socket } from "../utils/socket";

const CATEGORIES = [
  { id: "All", label: "All News", icon: "🌐" },
  { id: "Market", label: "Market News", icon: "📈" },
  { id: "Tech", label: "Tech News", icon: "💻" },
  { id: "AI", label: "AI", icon: "🤖" },
  { id: "Global", label: "Global", icon: "🌍" },
  { id: "Healthcare", label: "Healthcare", icon: "🏥" },
  { id: "Current Affairs", label: "Current Affairs", icon: "📰" }
];

const NewsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [summarizingId, setSummarizingId] = useState(null);
  const [analyzingStockId, setAnalyzingStockId] = useState(null);
  const [analysisErrorId, setAnalysisErrorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch past 24-hour news
  const fetchNews = async (category = "All") => {
    try {
      setLoading(true);
      const res = await getNews(category === "All" ? "" : category);
      setNewsList(res.data);
    } catch (err) {
      console.error("Error fetching news feed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 70-80 Word AI Summary Handler via Groq Llama-3.3-70B
  const handleGenerateSummary = async (e, newsId) => {
    e.stopPropagation();
    try {
      setSummarizingId(newsId);
      const res = await summarizeNews(newsId);
      const updatedDoc = res.data.news;

      setNewsList(prev => prev.map(n => n._id === newsId ? { ...n, aiSummary: updatedDoc.aiSummary } : n));
    } catch (err) {
      console.error("Error generating AI summary:", err);
    } finally {
      setSummarizingId(null);
    }
  };

  // Analyze Stock Impact & HFT Quant Trajectory Handler
  const handleAnalyzeStockImpact = async (e, newsId) => {
    e.stopPropagation();
    try {
      setAnalyzingStockId(newsId);
      setAnalysisErrorId(null);
      const res = await analyzeStock(newsId);
      const updatedAnalysis = res.data.stockAnalysis;
      setNewsList(prev => prev.map(n => n._id === newsId ? { ...n, stockAnalysis: updatedAnalysis } : n));
    } catch (err) {
      console.error("Error analyzing stock impact:", err);
      setAnalysisErrorId(newsId);
    } finally {
      setAnalyzingStockId(null);
    }
  };

  // Manual trigger sync
  const triggerManualSync = async () => {
    try {
      setSyncing(true);
      await syncNews();
      await fetchNews(selectedCategory);
    } catch (err) {
      console.error("Error triggering news sync:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const handleNewArticles = (newDocs) => {
      setNewsList((prev) => {
        const existingIds = new Set(prev.map(n => n._id || n.url));
        const filteredNew = newDocs.filter(n => !existingIds.has(n._id || n.url));
        return [...filteredNew, ...prev];
      });
    };

    socket.on("newNewsArticles", handleNewArticles);
    return () => socket.off("newNewsArticles", handleNewArticles);
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diffMs = new Date() - new Date(dateStr);
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return "Today";
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case "Market": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Tech": return "bg-blue-100 text-blue-800 border-blue-300";
      case "AI": return "bg-purple-100 text-purple-800 border-purple-300";
      case "Global": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Healthcare": return "bg-rose-100 text-rose-800 border-rose-300";
      case "Current Affairs": return "bg-cyan-100 text-cyan-800 border-cyan-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  // Keyword Filter
  const filteredNewsList = newsList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.source || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">24-Hour Real-Time News Stream</h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-purges articles 24 hours after DB insertion. Rate limited to max 5 articles per minute.
          </p>
        </div>

        <button
          onClick={triggerManualSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing..." : "Sync Fresh News"}
        </button>
      </div>

      {/* Keyword Search Input Bar */}
      <div className="mb-4">
        <div className="relative max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search news by keyword (e.g. Nvidia, Fed, AI, Market, Earnings)..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pill Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* News Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        </div>
      ) : filteredNewsList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            {searchQuery ? `No articles matching "${searchQuery}"` : "No news articles found for this category in the past 24 hours."}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? "Try searching for a different keyword like Nvidia, Fed, AI, or Tech." : "Click 'Sync Fresh News' above to trigger a new ingestion cycle!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNewsList.map((item) => {
            const isSummarizing = summarizingId === item._id;

            return (
              <div
                key={item._id || item.url}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Action Buttons Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(item.category)}`}>
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400 mr-1">
                        {formatTimeAgo(item.publishedAt || item.createdAt)}
                      </span>

                      {/* Sleek AI Summary Button */}
                      <button
                        onClick={(e) => handleGenerateSummary(e, item._id)}
                        disabled={isSummarizing}
                        className={`p-1 rounded-md transition-all text-xs flex items-center justify-center ${
                          item.aiSummary
                            ? "bg-blue-100 text-blue-700 font-bold shadow-inner"
                            : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                        } disabled:opacity-50`}
                        title="AI Summary"
                      >
                        {isSummarizing ? "⏳" : "⚡"}
                      </button>
                      
                      {/* Sleek Stock Impact & Quant Radar Button */}
                      <button
                        onClick={(e) => handleAnalyzeStockImpact(e, item._id)}
                        disabled={analyzingStockId === item._id}
                        className={`p-1 rounded-md transition-all text-xs flex items-center justify-center ${
                          item.stockAnalysis && item.stockAnalysis.analyzedAt
                            ? "bg-emerald-100 text-emerald-800 font-bold shadow-inner"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        } disabled:opacity-50`}
                        title="Stock Trajectory & HFT Quant Analysis"
                      >
                        {analyzingStockId === item._id ? "⏳" : "📊"}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2 hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Article Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* 70-80 Word Groq AI Executive Briefing Badge */}
                  {item.aiSummary && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-3 text-xs leading-relaxed text-amber-950 font-medium shadow-inner">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1 tracking-wider">
                        ⚡ 70-80 Word Executive Briefing (Groq AI):
                      </span>
                      {item.aiSummary}
                    </div>
                  )}

                  {/* Simple Notification Badge for Stock Analysis (No black dashboard on global feed) */}
                  {item.stockAnalysis && item.stockAnalysis.analyzedAt ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg mb-3 text-xs flex items-center justify-between font-semibold shadow-sm">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span>✓</span> Stock Analysis Performed!
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        View in Stock Intelligence 📈
                      </span>
                    </div>
                  ) : analysisErrorId === item._id && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg mb-3 text-xs flex items-center justify-between font-semibold shadow-sm">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span>⚠️</span> Analysis Service Busy. Please try again!
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Source & External Link */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                      📌 {item.source || "Global Feed"}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      Read Source ↗
                    </a>
                  </div>

                  {item.relatedSources && item.relatedSources.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100/80">
                      <span className="text-[10px] font-bold text-slate-400">Also on:</span>
                      {item.relatedSources.map((rel, i) => (
                        <a
                          key={i}
                          href={rel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {rel.source} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsSection;

