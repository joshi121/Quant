import News from "../models/newsmodel.js";
import { classifyNewsCategory } from "../utils/newsClassifier.js";
import { io } from "../socket.js";
import { findDuplicateStory } from "../utils/newsDeduplicator.js";
import { generateGroqAISummary } from "../gen_ai/index.js";

/**
 * Helper: Fetch live breaking news from Google News RSS Feeds
 */
const fetchGoogleNewsRSS = async () => {
  const rssUrls = [
    "https://news.google.com/rss/headlines/section/topic/BUSINESS",
    "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY",
    "https://news.google.com/rss/headlines/section/topic/HEALTH",
    "https://news.google.com/rss/headlines/section/topic/WORLD"
  ];

  const articles = [];

  for (const feedUrl of rssUrls) {
    try {
      const response = await fetch(feedUrl);
      
      const xml = await response.text(); //raw bytes converted into texts 
      
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []; //32 -35 items received in memory stored in xml block , sorted as the most fresh news first 
      
      for (const itemXml of items.slice(0, 4)) {
        const titleMatch = itemXml.match(/<title>(.*?)<\/title>/); //2 size array with full match and the insdie content match 
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
        const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/); //.*? grredy match find the first opening tag and the jsut next closing tag and then strip it out !!
// /g is a global flag to let javscript scan the entire string to look for similar opening and closing tags and keep returning the inside content in all of the o and c tags forming an array 

        let rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&') : '';
        let rawLink = linkMatch ? linkMatch[1] : '';
        let sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Global News';
        
        if (rawTitle && rawLink) {
          articles.push({
            title: rawTitle.trim(),
            description: rawTitle.trim(),
            url: rawLink.trim(),
            source: sourceName.trim(),
            publishedAt: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
            category: classifyNewsCategory(rawTitle, "")
          });
        }
      }
    } catch (e) {
      console.error("[GOOGLE RSS FETCH ERROR]:", e.message);
    }
  }

  return articles;
};

/**
 * Fetch and Store News Service
 * Rate-limited to max 5 articles per cycle
 */
export const fetchAndStoreNews = async () => {
  try {
    let freshArticles = [];

    // 1. Try Google News RSS first
    try {
      freshArticles = await fetchGoogleNewsRSS();
    } catch (rssErr) {
      console.log("[NEWS INGESTION] Google RSS fetch error:", rssErr.message);
    }
    if (!freshArticles || freshArticles.length === 0) {
      console.log("[NEWS INGESTION] No articles found to process.");
      return []; // Return clean empty array to the caller
    }

    const savedDocs = [];
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeNews = await News.find({ createdAt: { $gte: past24Hours } }); // we can also initialise a  global variable storign the fetched active articles in memory and filtering the 24 hrs old on every call  

    // let cachedActiveNews = null;

// export const fetchAndStoreNews = async () => {
//   try {
//     const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

//     // 1. First run / cold start: Load from DB once
//     if (cachedActiveNews === null) {
//       cachedActiveNews = await News.find({ createdAt: { $gte: past24Hours } });
//     } else {
//       // 2. Subsequent runs: Evict articles older than 24h entirely in memory (0 DB reads)
//       cachedActiveNews = cachedActiveNews.filter(
//         item => new Date(item.createdAt || item.publishedAt) >= past24Hours
//       );
//     }

    // Iterate through all fetched candidate articles across all categories
    for (const article of freshArticles) {
      const { isDuplicate, match, score } = findDuplicateStory(article, activeNews, 0.65);

      if (isDuplicate) {
        continue;
      } 
      const newDoc = await News.create({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source,
        category: article.category || classifyNewsCategory(article.title, article.description),
        publishedAt: article.publishedAt || new Date(),
        relatedSources: []
      });

      savedDocs.push(newDoc);
      activeNews.push(newDoc); // Prevent duplicates within the same batch

  // Cap at 5 unique articles per cycle
      if (savedDocs.length >= 5) {
        break;
      }
      
    }

    if (savedDocs.length > 0) {
      console.log(`[NEWS ENGINE SUCCESS] Ingested & stored ${savedDocs.length} fresh articles.`);
      if (io) {
        io.emit("newNewsArticles", savedDocs);
      }
    }

    return savedDocs;
  } catch (error) {
    console.error("[NEWS ENGINE ERROR]: Failed to fetch/store news:", error.message);
    return [];
  }
};

/**
 * Controller: Get Past 24-Hour News
 */
export const getNewsController = async (req, res) => {
  try {
    const { category } = req.query;
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = {
      createdAt: { $gte: past24Hours }
    };

    if (category && category !== "All") {
      query.category = category;
    }

    const newsList = await News.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(newsList);
  } catch (error) {
    console.error("Get news controller error:", error);
    return res.status(500).json({ message: "Internal server error fetching news" });
  }
};

/**
 * Controller: Manual Sync Endpoint
 */
export const syncNewsController = async (req, res) => {
  try {
    const newlySaved = await fetchAndStoreNews();
    return res.status(200).json({
      message: `News sync triggered. Ingested ${newlySaved.length} new articles.`,
      articles: newlySaved
    });
  } catch (error) {
    return res.status(500).json({ message: "Error triggering news sync" });
  }
};

/**
 * Controller: On-Demand AI Summarization Endpoint via Groq Llama-3.3-70B
 */
export const summarizeNewsController = async (req, res) => {
  try {
    const { newsId } = req.params;

    let news = await News.findById(newsId);
    if (!news) return res.status(404).json({ message: "News article not found" });

    // Check if aiSummary is already cached in MongoDB
    if (news.aiSummary && news.aiSummary.trim().length > 0) {
      return res.status(200).json({
        message: "Loaded from cache",
        news
      });
    }

    // Call Groq API (Throws error if API fails)
    const summary = await generateGroqAISummary(news.title, news.description);

    news.aiSummary = summary;
    await news.save(); //news card updated 

    return res.status(200).json({
      message: "Groq Llama-3.3-70B summary generated successfully",
      news
    });
  } catch (error) {
    console.error("Summarize news error:", error.message);
    return res.status(500).json({ message: `Failed to generate AI summary: ${error.message}` });
  }
};

/**
 * Controller: Delete AI Summary from BlinkNews
 */
export const deleteSummaryController = async (req, res) => {
  try {
    const { newsId } = req.params;

    const news = await News.findById(newsId);
    if (news) {
      news.aiSummary = "";
      await news.save();
    }

    return res.status(200).json({ message: "AI summary removed from BlinkNews" });
  } catch (error) {
    console.error("Delete summary error:", error);
    return res.status(500).json({ message: "Internal server error deleting summary" });
  }
};

/**
 * Controller: Fetch All Summarized News Articles for BlinkNews Tab
 */
export const getBlinkNewsController = async (req, res) => {
  try {
    const { category } = req.query;

    const query = {
      aiSummary: { $exists: true, $ne: "", $type: "string" }
    };

    if (category && category !== "All") {
      query.category = category;
    }

    const publicBlinkNews = await News.find(query).sort({ updatedAt: -1 }).limit(50); // updated at not created at shows that the latest news card summarised should be returned first 
    const blinkList = publicBlinkNews.filter(item => item.aiSummary && item.aiSummary.trim().length > 0);

    return res.status(200).json(blinkList);
  } catch (error) {
    console.error("Get BlinkNews error:", error);
    return res.status(500).json({ message: "Internal server error fetching BlinkNews" });
  }
};



