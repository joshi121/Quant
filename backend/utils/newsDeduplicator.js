/**
 * Utility: Cross-Publisher News Deduplication using Jaccard Similarity & Synonym Mapping
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves"
]);

const SYNONYM_MAP = {
  "fx": "forex",
  "inflows": "flows",
  "inflow": "flows",
  "fed": "federal reserve",
  "central bank": "federal reserve",
  "ai": "artificial intelligence",
  "llm": "artificial intelligence",
  "gpus": "gpu",
  "semiconductors": "chips",
  "semiconductor": "chips",
  "stocks": "market",
  "equities": "market",
  "crypto": "bitcoin",
  "btc": "bitcoin"
};

const ALLOWED_SHORT_FINANCIAL_TOKENS = new Set(["fx", "ai", "ev", "us", "uk", "eu"]);

/**
 * Strip source publisher suffix from headline (e.g. " - Reuters", " - Moneycontrol.com", " | Bloomberg")
 */
export const stripPublisherSuffix = (text = "") => {
  if (!text) return "";
  return text.replace(/(\s*[-–|:]\s*[A-Za-z0-9.\s]+)$/i, "").trim();
};

/**
 * Tokenize string into cleaned, normalized keyword set
 */
export const tokenizeText = (text = "") => {
  if (!text) return new Set();
  
  // Clean publisher suffix first
  const cleanedHeadline = stripPublisherSuffix(text);

  // Lowercase & remove non-alphanumeric characters except spaces
  let cleaned = cleanedHeadline.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  
  // Replace known synonym phrases
  Object.keys(SYNONYM_MAP).forEach((key) => {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    cleaned = cleaned.replace(regex, SYNONYM_MAP[key]);
  });

  const tokens = cleaned.split(/\s+/).filter(word => 
    (word.length > 2 || ALLOWED_SHORT_FINANCIAL_TOKENS.has(word)) && !STOP_WORDS.has(word)
  );

  return new Set(tokens);
};

/**
 * Calculate Jaccard Similarity Score between two Keyword Sets (0.0 to 1.0)
 */
export const calculateJaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

/**
 * Evaluates whether an incoming article is a duplicate of any existing articles.
 * Calibrated threshold set to 0.50 (50%) for cross-publisher headline deduplication.
 */


export const findDuplicateStory = (incomingArticle, existingArticles = [], threshold = 0.65) => {
  const incomingTokens = tokenizeText(incomingArticle.title);

  for (const existingDoc of existingArticles) {
    // Check exact URL match first
    if (existingDoc.url === incomingArticle.url) {
      return { isDuplicate: true, match: existingDoc, score: 1.0 };
    }

    const existingTokens = tokenizeText(existingDoc.title);
    const score = calculateJaccardSimilarity(incomingTokens, existingTokens);

    if (score >= threshold) {
      return { isDuplicate: true, match: existingDoc, score };
    }
  }

  return { isDuplicate: false, match: null, score: 0 };
};
