// import { TAVILY_PARSER_PROMPT } from "../prompts/prompts.js";

// const FAST_MODELS = [
//   "openai/gpt-oss-20b",
//   "openai/gpt-oss-120b"
// ];

// // Stage 2 + 3: Execute Tavily search and parse tickers from web results with full fallback to Pass 1 tickers
// export const discoverIndustryTitans = async (primarySector = "Market", secondarySectors = [], affectedTickers = [], newsTitle = "", searchQuery = "") => {

//   const normalizedPass1 = (Array.isArray(affectedTickers) ? affectedTickers : [])
//     .filter(t => t && (t.ticker || t.symbol))
//     .map(t => ({
//       ticker: String(t.ticker || t.symbol).trim().toUpperCase(),
//       name: t.name || t.ticker,
//       orderType: t.orderType || "First-Order (Direct)"
//     }));

//   // If Groq Pass 1 already extracted specific tickers with high confidence (4+), use those directly
//   if (normalizedPass1.length >= 4) {
//     console.log("[TAVILY SERVICE]: Groq Pass 1 extracted enough direct tickers, using direct list:", normalizedPass1.map(t => t.ticker));
//     return normalizedPass1.slice(0, 5);
//   }

//   const tavilyKey = process.env.TAVILY_API_KEY;

//   // Build the search query
//   const effectiveQuery = searchQuery ||
//     `top publicly listed traded companies distributors aggregators rivals stocks tickers in ${primarySector} ${secondarySectors.slice(0, 2).join(" ")} related to: ${newsTitle}`;

//   console.log(`\n==================================================`);
//   console.log(`[TAVILY STEP 2: DISCOVERY SEARCH]`);
//   console.log(`Query: "${effectiveQuery}"`);
//   console.log(`==================================================`);

//   // Stage 2: Live Tavily Web Search
//   if (tavilyKey) {
//     try {
//       const tavilyRes = await fetch("https://api.tavily.com/search", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           api_key: tavilyKey,
//           query: effectiveQuery,
//           max_results: 8,
//           search_depth: "basic"
//         })
//       });

//       if (tavilyRes.ok) {
//         const tavilyData = await tavilyRes.json();
//         const rawContent = (tavilyData.results || [])
//           .map(r => `${r.title} ${r.content}`)
//           .join("\n")
//           .substring(0, 3000);

//         console.log(`[TAVILY RAW RESULTS LENGTH]: ${rawContent.length} chars of content retrieved.`);

//         if (rawContent.length > 100) {
//           const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1;
//           if (groqKey) {
//             console.log(`[GROQ PASS 1.5 (Tavily Parser) INPUT]: Submitting web content to Groq fast model chain...`);
            
//             for (const modelId of FAST_MODELS) {
//               try {
//                 const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//                   method: "POST",
//                   headers: {
//                     "Authorization": `Bearer ${groqKey}`,
//                     "Content-Type": "application/json"
//                   },
//                   body: JSON.stringify({
//                     model: modelId,
//                     messages: [
//                       { role: "system", content: TAVILY_PARSER_PROMPT + "\nRespond ONLY with a valid JSON object." },
//                       { role: "user", content: `News Domain: ${primarySector} — ${newsTitle}\n\nWeb Search Results:\n${rawContent}` }
//                     ],
//                     max_tokens: 400,
//                     temperature: 0.1
//                   })
//                 });

//                 if (groqRes.ok) {
//                   const groqData = await groqRes.json();
//                   const raw = groqData?.choices?.[0]?.message?.content?.trim().replace(/```json|```/g, "") || "{}";
//                   const match = raw.match(/\{[\s\S]*\}/);
//                   const cleanJsonStr = match ? match[0] : raw;
//                   const parsedObj = JSON.parse(cleanJsonStr);
//                   const parsed = parsedObj.tickers || [];
//                   if (Array.isArray(parsed) && parsed.length > 0) {
//                     const blacklist = ["CHINA", "INDIA", "USA", "UK", "GERMANY", "JAPAN", "RUSSIA", "BSE", "NSE", "NYSE", "NASDAQ", "INDEX", "NIFTY", "SENSEX", "SPX"];
//                     const clean = parsed.filter(t => t && t.ticker && !blacklist.includes(t.ticker.trim().toUpperCase()));
                    
//                     if (clean.length >= 1) {
//                       console.log(`[GROQ PASS 1.5 (Tavily Parser) OUTPUT via ${modelId}]:`, JSON.stringify(clean, null, 2));
//                       return clean.slice(0, 5);
//                     }
//                   }
//                 }
//               } catch (parseErr) {
//                 console.warn(`[TAVILY GROQ PARSER WARNING]: Model ${modelId} failed: ${parseErr.message}`);
//               }
//             }
//           }
//         }
//       }
//     } catch (err) {
//       console.warn("[TAVILY SEARCH WARNING]:", err.message);
//     }
//   }

//   // Fallback: If Tavily returned 0 tickers or search failed, return Pass 1 tickers if available!
//   if (normalizedPass1.length > 0) {
//     console.log(`[TAVILY FALLBACK]: Web search found no new tickers. Reverting to Pass 1 extracted tickers:`, normalizedPass1.map(t => t.ticker));
//     return normalizedPass1.slice(0, 5);
//   }

//   console.log(`[TAVILY + GROQ PARSE FAIL]: No tickers discovered from web search or Pass 1. Returning empty array.`);
//   return [];
// };


import { TAVILY_PARSER_PROMPT } from "../prompts/prompts.js";

const FAST_MODELS = [
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b"
];

const BLACKLIST = new Set([
  "CHINA", "INDIA", "USA", "UK", "GERMANY", "JAPAN", "RUSSIA",
  "BSE", "NSE", "NYSE", "NASDAQ", "INDEX", "NIFTY", "SENSEX", "SPX"
]);

export const discoverIndustryTitans = async (primarySector = "Market", secondarySectors = [], affectedTickers = [], newsTitle = "", searchQuery = "") => {
  const normalizedPass1 = (affectedTickers || [])
    .filter(t => t?.ticker || t?.symbol)
    .map(t => ({
      ticker: String(t.ticker || t.symbol).trim().toUpperCase(),
      name: t.name || t.ticker,
      orderType: t.orderType || "First-Order (Direct)"
    }));

  // Short-circuit if Pass 1 already extracted sufficient tickers
  if (normalizedPass1.length >= 2) {
    return normalizedPass1.slice(0, 5);
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (tavilyKey && groqKey) {
    try {
      const query = searchQuery || `top publicly traded stock tickers in ${primarySector} ${secondarySectors.slice(0, 2).join(" ")} related to: ${newsTitle}`;

      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, //tolet hte server know that the request isin json format 
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          max_results: 8,
          search_depth: "basic"
        })
      });

      if (tavilyRes.ok) {
        const { results = [] } = await tavilyRes.json();
        const rawContent = results.map(r => `${r.title} ${r.content}`).join("\n").slice(0, 3000);

        if (rawContent.length > 100) {
          for (const model of FAST_MODELS) {
            try {
              const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${groqKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model,
                  messages: [
                    { role: "system", content: TAVILY_PARSER_PROMPT },
                    { role: "user", content: `News Domain: ${primarySector} — ${newsTitle}\n\nWeb Search Results:\n${rawContent}` }
                  ],
                  max_tokens: 400,
                  temperature: 0.1,
                  reasoning_format: "hidden",
                  response_format: { type: "json_object" }
                })
              });

              if (groqRes.ok) {
                const data = await groqRes.json();
                const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
                const tickers = (parsed.tickers || [])
                  .filter(t => t?.ticker && !BLACKLIST.has(t.ticker.trim().toUpperCase()));

                if (tickers.length > 0) {
                  return tickers.slice(0, 5);
                }
              }
            } catch {
              // Try next fallback model
              console.warn("[TAVILY SEARCH WARNING]:", err.message);
            }
          }
        }
      }
    } catch {
      // Allow seamless fallback to Pass 1 tickers on network/Tavily failure
      console.warn("[TAVILY SEARCH WARNING]:", err.message);
    }
  }

  return normalizedPass1.slice(0, 5);
};
