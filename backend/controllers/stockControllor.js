import News from "../models/newsmodel.js";
import { fetchYahooStockData } from "../services/yahooFinanceService.js";
import { runQuantAnalysisPipeline } from "../utils/quantEngine.js";
import { 
  runGroqStep0_ContextSummarizer, 
  runGroqPass1_SectorExtraction, 
  runGroqPass2_Synthesis, 
  discoverIndustryTitans 
} from "../gen_ai/index.js";

/**
 * Controller: On-Demand Stock Impact & Quant Trajectory Analysis Engine
 */
export const analyzeStockImpactController = async (req, res) => {
  try {
    const { newsId } = req.params; // inside the url 

    // Check in main News collection
    let news = await News.findById(newsId);
    if (!news) return res.status(404).json({ message: "News article not found" });

    // Bypass cache if force query is passed
    if (news.stockAnalysis && news.stockAnalysis.analyzedAt && req.query.force !== "true") {
      console.log("[STOCK ANALYSIS CACHE HIT]: Returning cached quant report from MongoDB.");
      return res.status(200).json({
        message: "Loaded from cache",
        stockAnalysis: news.stockAnalysis
      });
    }

    // Step 0: Generate in-memory concise news summary context (with fallback)
    let conciseSummary = "";
    try {
      conciseSummary = await runGroqStep0_ContextSummarizer(news.title, news.description || "");
    } catch (step0Err) {
      console.warn("[STOCK CONTROLLER]: Step 0 summarizer warning:", step0Err.message, "Using description fallback.");
      conciseSummary = news.description || news.title;
    }

    // Pass 1: AI Sector Extraction & Severity % Rating
    const pass1Data = await runGroqPass1_SectorExtraction(news.title, news.description || "", conciseSummary);

    // Guardrail: Low impact threshold
    if (pass1Data.severityRating < 5) {
      const lowImpactAnalysis = {
        analyzedAt: new Date(),
        severityRating: pass1Data.severityRating,
        sentiment: pass1Data.sentiment || "Neutral",
        sentimentScore: pass1Data.sentimentScore || 0,
        primarySector: pass1Data.primarySector || "General",
        secondarySectors: pass1Data.secondarySectors || [],
        isLowImpact: true,
        lowImpactMessage: `Low Market Exposure (~${pass1Data.severityRating}% Severity). Negligible price target drift anticipated for this story.`,
        stocks: [],
        aiExecutiveBriefing: `Low Market Impact Assessment: This news story registers a ${pass1Data.severityRating}% market severity rating. Economic impact is localized with negligible systemic transmission to equity markets.`
      };

      news.stockAnalysis = lowImpactAnalysis;
      await news.save();

      return res.status(200).json({
        message: "Low impact analysis complete",
        stockAnalysis: lowImpactAnalysis
      });
    }

    // Step 2: Discover Industry Titans via Tavily + Pass 1 Tickers
    const titans = await discoverIndustryTitans(
      pass1Data.primarySector, 
      pass1Data.secondarySectors, 
      pass1Data.affectedTickers,
      news.title,
      pass1Data.searchQuery || ""
    );

    // Step 3 & 4: Ingest Live quotes via Yahoo Finance Engine & Run Quant Engine
    const quantStocks = [];

    for (const titan of titans) {
      const yahooData = await fetchYahooStockData(titan.ticker);
      if (!yahooData) continue;

      const quantResult = runQuantAnalysisPipeline({
        ticker: yahooData.ticker,
        companyName: titan.name || yahooData.companyName || yahooData.ticker,
        severityRating: pass1Data.severityRating,
        sentimentScore: pass1Data.sentimentScore,
        currentPrice: yahooData.currentPrice,
        beta: yahooData.beta,
        sma50: yahooData.sma50,
        orderType: titan.orderType || "First-Order (Direct)"
      });

      quantResult.currency = yahooData.currency || (yahooData.ticker.endsWith(".NS") || yahooData.ticker.endsWith(".BO") ? "INR" : "USD");

      quantStocks.push(quantResult);
    }

    // Handle case where 0 stocks were retrieved
    if (quantStocks.length === 0) {
      const noStocksAnalysis = {
        analyzedAt: new Date(),
        severityRating: pass1Data.severityRating,
        sentiment: pass1Data.sentiment || "Neutral",
        sentimentScore: pass1Data.sentimentScore || 0,
        primarySector: pass1Data.primarySector || "General",
        secondarySectors: pass1Data.secondarySectors || [],
        isLowImpact: true,
        lowImpactMessage: `General Sector Impact (${pass1Data.severityRating}% Severity). No specific listed equities identified directly linked to this story.`,
        stocks: [],
        aiExecutiveBriefing: `Sector Analysis (${pass1Data.primarySector}): Broad macro/domain impact assessed at ${pass1Data.severityRating}%. No specific exchange-listed stock tickers directly tied to this news narrative.`
      };

      news.stockAnalysis = noStocksAnalysis;
      await news.save();

      return res.status(200).json({
        message: "Stock analysis completed (no direct stock exposure)",
        stockAnalysis: noStocksAnalysis
      });
    }

    // Pass 2: AI Trade Briefing
    let briefing = "";
    try {
      briefing = await runGroqPass2_Synthesis(news.title, news.description, quantStocks, pass1Data);
    } catch (pass2Err) {
      console.warn("[STOCK CONTROLLER]: Pass 2 briefing warning:", pass2Err.message);
      const topStock = quantStocks[0];
      briefing = `GROW 🟢 ${topStock.ticker} target price ${topStock.currency === "INR" ? "₹" : "$"}${topStock.targetPrice} (${topStock.percentDrift}% drift).`;
    }

    const fullStockAnalysis = {
      analyzedAt: new Date(),
      severityRating: pass1Data.severityRating,
      sentiment: pass1Data.sentiment,
      sentimentScore: pass1Data.sentimentScore,
      primarySector: pass1Data.primarySector,
      secondarySectors: pass1Data.secondarySectors,
      isLowImpact: false,
      lowImpactMessage: "",
      stocks: quantStocks,
      aiExecutiveBriefing: briefing
    };

    news.stockAnalysis = fullStockAnalysis;
    await news.save();

    return res.status(200).json({
      message: "Stock analysis engine completed successfully",
      stockAnalysis: fullStockAnalysis
    });
  } catch (error) {
    console.error("Stock impact analysis error:", error.message);
    return res.status(500).json({ message: `Stock analysis engine failed: ${error.message}` });
  }
};

/**
 * Controller: Fetch All Analyzed Stock Reports for Stock Intelligence Section
 */
export const getStockIntelligenceController = async (req, res) => {
  try {
    const query = {
      "stockAnalysis.analyzedAt": { $exists: true }
    };

    const publicAnalyzed = await News.find(query).sort({ "stockAnalysis.analyzedAt": -1 }).limit(50);
    return res.status(200).json(publicAnalyzed);
  } catch (error) {
    console.error("Get Stock Intelligence error:", error);
    return res.status(500).json({ message: "Internal server error fetching stock intelligence" });
  }
};

/**
 * Controller: Delete Stock Analysis Report
 */
export const deleteStockAnalysisController = async (req, res) => {
  try {
    const { newsId } = req.params;
    await News.findByIdAndUpdate(newsId, { $unset: { stockAnalysis: 1 } });
    return res.status(200).json({ message: "Stock analysis report deleted successfully" });
  } catch (error) {
    console.error("Delete stock analysis error:", error);
    return res.status(500).json({ message: "Internal server error deleting stock report" });
  }
};
