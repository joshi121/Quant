import React, { useState, useEffect } from "react";
import { getBlinkNews, deleteSummary } from "../services/newsService.js";

const CATEGORIES = [
  { id: "All", label: "All Summaries", icon: "⚡" },
  { id: "Market", label: "Market", icon: "📈" },
  { id: "Tech", label: "Tech", icon: "💻" },
  { id: "AI", label: "AI", icon: "🤖" },
  { id: "Global", label: "Global", icon: "🌍" },
  { id: "Healthcare", label: "Healthcare", icon: "🏥" },
  { id: "Current Affairs", label: "Current Affairs", icon: "📰" }
];

const BlinkNewsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blinkNewsList, setBlinkNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch summarized news articles for BlinkNews
  const fetchBlinkNews = async (category = "All") => {
    try {
      setLoading(true);
      const res = await getBlinkNews(category === "All" ? "" : category);
      const validSummaries = (res.data || []).filter(item => item.aiSummary && item.aiSummary.trim().length > 0);
      setBlinkNewsList(validSummaries);
    } catch (err) {
      console.error("Error fetching BlinkNews:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Summary Handler (removes summary from BlinkNews)
  const handleDeleteSummary = async (newsId) => {
    try {
      await deleteSummary(newsId);
      setBlinkNewsList((prev) => prev.filter((item) => (item._id || item.newsId) !== newsId));
    } catch (err) {
      console.error("Error deleting summary:", err);
    }
  };

  useEffect(() => {
    fetchBlinkNews(selectedCategory);
  }, [selectedCategory]);

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

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>⚡</span> BlinkNews (GPT OSS 20B AI Summaries)
            </h1>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
              {blinkNewsList.length} Summarized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Summaries requested by you via GPT OSS 20B. These cards are permanently saved and never auto-deleted.
          </p>
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
                  ? "bg-amber-600 text-white border-amber-600 shadow-md font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* BlinkNews Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
        </div>
      ) : blinkNewsList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">No summarized articles yet.</p>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Click the sleek <b>⚡</b> button on any article card in the <b>24h News Feed</b> section to generate a 60-word Groq Llama-3.3-70B AI summary!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blinkNewsList.map((item) => {
            const cardId = item.newsId || item._id;
            return (
              <div
                key={cardId}
                className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Timestamp Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatTimeAgo(item.publishedAt || item.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* 70-80 Word Groq AI Summary Badge Container */}
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-3 text-xs leading-relaxed text-amber-950 font-medium shadow-inner">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1 tracking-wider">
                      ⚡ 70-80 Word Executive Briefing (Groq Llama-3.3-70B):
                    </span>
                    {item.aiSummary}
                  </div>
                </div>

                {/* Footer Actions: Delete Summary & External Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => handleDeleteSummary(cardId)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                    title="Delete summary from BlinkNews"
                  >
                    🗑️ Delete Summary
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Read Source ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlinkNewsSection;
