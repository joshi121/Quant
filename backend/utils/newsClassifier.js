/**
 * Auto-classifies a news article into one of the 6 categories based on keyword rules.
 * Categories: Market, Tech, AI, Global, Healthcare, Current Affairs
 */
export const classifyNewsCategory = (title = "", description = "") => {
  const text = `${title} ${description}`.toLowerCase();

  // 1. AI Category
  const aiKeywords = ["ai", "artificial intelligence", "llm", "chatgpt", "openai", "nvidia", "deepseek", "claude", "machine learning", "neural network", "generative ai", "robotics"];
  if (aiKeywords.some(kw => text.includes(kw))) {
    return "AI";
  }

  // 2. Healthcare Category
  const healthKeywords = ["fda", "pharma", "vaccine", "health", "biotech", "cancer", "clinical trial", "hospital", "drug", "medicine", "gene therapy"];
  if (healthKeywords.some(kw => text.includes(kw))) {
    return "Healthcare";
  }

  // 3. Tech Category
  const techKeywords = ["semiconductor", "chip", "apple", "microsoft", "google", "meta", "intel", "amd", "software", "cybersecurity", "hardware", "cloud", "saas", "quantum"];
  if (techKeywords.some(kw => text.includes(kw))) {
    return "Tech";
  }

  // 4. Market Category
  const marketKeywords = ["stock", "shares", "nasdaq", "dow jones", "s&p 500", "fed", "interest rate", "inflation", "earnings", "revenue", "quarterly", "investor", "wall street", "ipo", "crypto", "bitcoin"];
  if (marketKeywords.some(kw => text.includes(kw))) {
    return "Market";
  }

  // 5. Global Category
  const globalKeywords = ["war", "conflict", "oil", "crude", "energy", "opec", "trade war", "tariffs", "sanctions", "geopolitical", "europe", "asia", "china", "middle east"];
  if (globalKeywords.some(kw => text.includes(kw))) {
    return "Global";
  }

  // Default Fallback: Current Affairs
  return "Current Affairs";
};
