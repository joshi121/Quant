import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    aiSummary: {
      type: String,
      default: "", // Crisp 70-80 word AI generated summary
    },
    url: {
      type: String,
      required: true,
      unique: true,
    },
    source: {
      type: String,
      default: "Global Financial Feed",
    },
    category: {
      type: String,
      enum: ["Market", "Tech", "AI", "Global", "Healthcare", "Current Affairs"],
      default: "Current Affairs",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    relatedSources: [
      {
        source: String,
        url: String,
      }
    ],
    stockAnalysis: {
      analyzedAt: Date,
      severityRating: Number, // 0% to 100%
      sentiment: String, // "Bullish", "Bearish", "Neutral"
      sentimentScore: Number, // -1.0 to +1.0
      primarySector: String,
      secondarySectors: [String],
      isLowImpact: Boolean, // True if severity < 25%
      lowImpactMessage: String,
      stocks: [
        {
          ticker: String,
          companyName: String,
          currentPrice: Number,
          currency: String, // e.g. "USD", "INR"
          beta: Number,
          sma50: Number,
          newsImpact: Number, // N = Sentiment * Severity
          trendPercent: Number, // T% = ((P - SMA50) / SMA50) * 100
          percentDrift: Number, // Delta P (%)
          targetPrice: Number, // Target ($/INR)
          trajectory: String, // "BULLISH", "BEARISH", "NEUTRAL"
          orderType: String // "First-Order (Direct)" vs "Second-Order (Supply Chain)"
        }
      ],
      aiExecutiveBriefing: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL Index: Auto-deletes document 24 hours after creation
    },
  },
  {
    timestamps: true,
  }
);

const News = mongoose.model("News", newsSchema);

export default News;
