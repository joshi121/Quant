// import { 
//   EXECUTIVE_SUMMARY_PROMPT, 
//   CONTEXT_SUMMARIZER_PROMPT, 
//   SECTOR_EXTRACTION_PROMPT, 
//   EXECUTIVE_BRIEFING_PROMPT 
// } from "../prompts/prompts.js";

// // High-capacity models for complex financial analysis, sector extraction, and executive briefings
// const HEAVY_MODELS = [
//   "openai/gpt-oss-120b",
//   "openai/gpt-oss-20b"
// ];

// // Low-latency high-speed models for quick 30-word context summarization and ticker parsing
// const FAST_MODELS = [
//   "openai/gpt-oss-20b",
//   "openai/gpt-oss-120b"
// ];

// // Helper: Clean raw completion output from LLM and remove thinking tags and preamble safely
// const cleanGroqText = (rawText) => {
//   if (!rawText) return "";

//   // Standard closed think tag removal
//   let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

//   // Strip unclosed think blocks if present
//   if (cleaned.includes("<think>")) {
//     cleaned = cleaned.replace(/<think>[\s\S]*/gi, "").trim();
//   }
//   cleaned = cleaned.replace(/<\/?think>/gi, "").trim();

//   // Strip preamble headers like "Here's a thinking process:", "1. **Analyze User Input:**" before bullet points
//   if (cleaned.includes("\n- ") || cleaned.includes("\n• ")) {
//     cleaned = cleaned.replace(/^[\s\S]*?(?=(\n- |\n• |- |• ))/i, "").trim();
//   }

//   // Strip inline word-counting token annotations e.g. (1), (2), (25)
//   cleaned = cleaned.replace(/\(\d+\)/g, "");

//   // Strip arrow token counters like -> 25
//   cleaned = cleaned.replace(/->\s*\d+/g, "");

//   // Strip calculation lines like Total: 18+20+19+25 = 82 words or Need to trim...
//   cleaned = cleaned.replace(/Total:\s*\d+[\s\S]*?(•|-|$)/gi, "");
//   cleaned = cleaned.replace(/Need to trim[\s\S]*?(•|-|$)/gi, "");

//   // Clean up any extra spacing
//   cleaned = cleaned.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();

//   return cleaned;
// };

// // Helper: Execute Groq Chat Completion with Automatic Model Fallback Loop
// const callGroqAPI = async (apiKey, modelList, messages, maxTokens = 1000, temperature = 0.3, isJson = false) => {
//   let lastError = null;

//   for (const modelId of modelList) {
//     try {
//       const payload = {
//         model: modelId,
//         messages: messages,
//         max_tokens: maxTokens,
//         temperature: temperature
//       };

//       const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${apiKey}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(payload)
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.choices && data.choices[0] && data.choices[0].message) {
//           const rawContent = data.choices[0].message.content || "";
          
//           if (isJson) {
//             // For JSON output, strip thinking tags and codeblocks without mutating JSON structure
//             let jsonCleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
//             jsonCleaned = jsonCleaned.replace(/<\/?think>/gi, "").trim();
//             jsonCleaned = jsonCleaned.replace(/```json|```/g, "").trim();
//             if (jsonCleaned.length > 0) {
//               console.log(`[GROQ SUCCESS (JSON)]: Executed using active model "${modelId}"`);
//               return jsonCleaned;
//             }
//           } else {
//             const finalContent = cleanGroqText(rawContent);
//             if (finalContent.length > 0) {
//               console.log(`[GROQ SUCCESS (PROSE)]: Executed using active model "${modelId}"`);
//               return finalContent;
//             }
//           }
//         }
//       } else {
//         const errText = await response.text();
//         console.warn(`[GROQ MODEL FALLBACK] Model "${modelId}" HTTP ${response.status}: ${errText.slice(0, 150)}`);
//         lastError = new Error(`Groq API error (${response.status}): ${errText}`);
//       }
//     } catch (err) {
//       console.warn(`[GROQ MODEL ATTEMPT FAIL] Model "${modelId}" failed: ${err.message}. Retrying next model...`);
//       lastError = err;
//     }
//   }

//   throw lastError || new Error("All Groq model attempts failed.");
// };

// // Helper: Extract valid JSON object from LLM response text
// const extractJsonObject = (rawText) => {
//   if (!rawText) throw new Error("Empty text provided for JSON extraction");
  
//   let cleaned = rawText.replace(/```json|```/g, "").trim();
//   const firstBrace = cleaned.indexOf("{");
//   const lastBrace = cleaned.lastIndexOf("}");

//   const jsonCandidate = (firstBrace !== -1 && lastBrace > firstBrace)
//     ? cleaned.substring(firstBrace, lastBrace + 1)
//     : cleaned;

//   try {
//     return JSON.parse(jsonCandidate);
//   } catch (firstErr) {
//     try {
//       const sanitized = jsonCandidate
//         .replace(/,\s*([\}\]])/g, "$1") // Remove trailing commas
//         .replace(/\/\/.*/g, "") // Remove single-line comments
//         .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments
      
//       return JSON.parse(sanitized);
//     } catch (secondErr) {
//       console.error("[GROQ JSON PARSE ERROR] Raw text:\n", rawText);
//       throw new Error(`Failed to parse JSON response: ${firstErr.message}`);
//     }
//   }
// };

// // Helper: Generate detailed 70-80 word AI summary using Groq
// export const generateGroqAISummary = async (title, text) => {
//   const apiKey = process.env.GROQ_API_KEY;
//   const cleanTitle = (title || "").trim();
//   const cleanText = (text || "").trim();

//   if (!apiKey) {
//     throw new Error("GROQ_API_KEY is not configured in environment variables.");
//   }

//   const messages = [
//     { role: "system", content: EXECUTIVE_SUMMARY_PROMPT },
//     { role: "user", content: `Headline: ${cleanTitle}\nStory Text: ${cleanText}` }
//   ];

//   const resultText = await callGroqAPI(apiKey, HEAVY_MODELS, messages, 2000, 0.3);
//   return resultText;
// };

// // Step 0: In-Memory 30-Word AI Context Summarizer
// export const runGroqStep0_ContextSummarizer = async (title, text) => {
//   const apiKey = process.env.GROQ_API_KEY;
//   const cleanTitle = (title || "").trim();
//   const cleanText = (text || "").trim();

//   if (!apiKey) {
//     throw new Error("GROQ_API_KEY is missing for Context Summarizer.");
//   }

//   const messages = [
//     { role: "system", content: CONTEXT_SUMMARIZER_PROMPT },
//     { role: "user", content: `Title: ${cleanTitle}\nBody: ${cleanText}` }
//   ];

//   const resultText = await callGroqAPI(apiKey, FAST_MODELS, messages, 500, 0.1);
//   return resultText;
// };

// // Pass 1: AI Sector Extraction & Severity % Rating
// export const runGroqPass1_SectorExtraction = async (title, text, conciseSummary) => {
//   const apiKey = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
//   const cleanTitle = (title || "").trim();
//   const cleanText = (text || "").trim();

//   if (!apiKey) {
//     throw new Error("GROQ_API_KEY is missing for Sector Extraction.");
//   }

//   const messages = [
//     { role: "system", content: SECTOR_EXTRACTION_PROMPT + "\nRespond ONLY with a valid JSON object." },
//     { role: "user", content: `Headline: ${cleanTitle}\nConcise News Summary (Context): ${conciseSummary}\nFull Story Text: ${cleanText}` }
//   ];

//   const resultText = await callGroqAPI(apiKey, HEAVY_MODELS, messages, 1000, 0.2, true);
//   return extractJsonObject(resultText);
// };

// // Pass 2: AI Executive Financial Briefing Synthesis
// export const runGroqPass2_Synthesis = async (title, description, quantStocks, pass1Data) => {
//   const apiKey = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
//   const cleanTitle = (title || "").trim();
//   const cleanDesc = (description || "").trim();

//   if (!apiKey) {
//     throw new Error("GROQ_API_KEY is missing for Executive Briefing.");
//   }

//   const stocksSummary = quantStocks.map(s => `${s.ticker} (${s.companyName}): Live Price ${s.currency === "INR" ? "INR" : "$"}${s.currentPrice}, Beta ${s.beta}, News Impact: ${s.newsImpact}, 50-Day Trend: ${s.trendPercent}%, Target Price: ${s.currency === "INR" ? "INR" : "$"}${s.targetPrice} (${s.percentDrift}%), Trajectory: ${s.trajectory}`).join("\n");

//   const messages = [
//     { role: "system", content: EXECUTIVE_BRIEFING_PROMPT },
//     { role: "user", content: `NEWS HEADLINE NARRATIVE:\nTitle: ${cleanTitle}\nContext: ${cleanDesc}\n\nPRIMARY SECTOR: ${pass1Data.primarySector} (Severity: ${pass1Data.severityRating}%)\n\nQUANT STOCK & YAHOO RESULTS:\n${stocksSummary}` }
//   ];

//   const rawText = await callGroqAPI(apiKey, HEAVY_MODELS, messages, 500, 0.3);
//   return rawText;
// };


import { 
  EXECUTIVE_SUMMARY_PROMPT, 
  CONTEXT_SUMMARIZER_PROMPT, 
  SECTOR_EXTRACTION_PROMPT, 
  EXECUTIVE_BRIEFING_PROMPT 
} from "../prompts/prompts.js";

const HEAVY_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];
const FAST_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

// Call Groq API with model fallback and automatic JSON parsing when requested
const callGroqAPI = async (modelList, messages, maxTokens = 1000, temperature = 0.2, isJson = false) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY environment variable is missing.");

  let lastError = null;

  for (const model of modelList) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          reasoning_format: "hidden",
          ...(isJson && { response_format: { type: "json_object" } })
        })
      });

      if (!response.ok) throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      return isJson ? JSON.parse(content) : content;
    } catch (err) {
      lastError = err;
    }

  }

  throw lastError || new Error("All Groq model attempts failed.");
};

// Step 0: In-Memory 30-Word AI Context Summarizer
export const runGroqStep0_ContextSummarizer = async (title, text) => {
  return callGroqAPI(
    FAST_MODELS, 
    [
      { role: "system", content: CONTEXT_SUMMARIZER_PROMPT },
      { role: "user", content: `Title: ${title}\nBody: ${text}` }
    ], 
    150, 
    0.1
  );
};

// Pass 1: AI Sector Extraction & Severity % Rating
export const runGroqPass1_SectorExtraction = async (title, text, conciseSummary) => {
  return callGroqAPI(
    HEAVY_MODELS, 
    [
      { role: "system", content: SECTOR_EXTRACTION_PROMPT },
      { role: "user", content: `Headline: ${title}\nConcise News Summary: ${conciseSummary}\nFull Story Text: ${text}` }
    ], 
    1000, 
    0.1, 
    true
  );
};

// Pass 2: AI Executive Financial Briefing Synthesis
export const runGroqPass2_Synthesis = async (title, description, quantStocks, pass1Data) => {
  const stocksSummary = quantStocks
    .map(s => `${s.ticker} (${s.companyName}): Live Price ${s.currency === "INR" ? "INR" : "$"}${s.currentPrice}, Beta ${s.beta}, News Impact: ${s.newsImpact}, 50-Day Trend: ${s.trendPercent}%, Target Price: ${s.currency === "INR" ? "INR" : "$"}${s.targetPrice} (${s.percentDrift}%), Trajectory: ${s.trajectory}`)
    .join("\n");

  return callGroqAPI(
    HEAVY_MODELS, 
    [
      { role: "system", content: EXECUTIVE_BRIEFING_PROMPT },
      { role: "user", content: `NEWS HEADLINE NARRATIVE:\nTitle: ${title}\nContext: ${description}\n\nPRIMARY SECTOR: ${pass1Data.primarySector} (Severity: ${pass1Data.severityRating}%)\n\nQUANT STOCK & YAHOO RESULTS:\n${stocksSummary}` }
    ], 
    300, 
    0.2
  );
};

// AI Summary generation
export const generateGroqAISummary = async (title, text) => {
  return callGroqAPI(
    FAST_MODELS, 
    [
      { role: "system", content: EXECUTIVE_SUMMARY_PROMPT },
      { role: "user", content: `Headline: ${title}\nStory Text: ${text}` }
    ], 
    800, 
    0.3
  );
};



// import { GoogleGenAI } from '@google/genai';
// import Groq from 'groq-sdk';

// // ==========================================
// // 1. Initializing the Clients
// // ==========================================

// // Gemini Client
// // By default, it looks for process.env.GEMINI_API_KEY
// const geminiClient = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY
// });

// // Groq Client
// // By default, it looks for process.env.GROQ_API_KEY
// const groqClient = new Groq({
//   apiKey: process.env.GROQ_API_KEY
// });

// // ==========================================
// // 2. Making Requests with Messages & Payloads
// // ==========================================

// async function runGeminiExample() {
//   const model = 'gemini-2.5-flash';
  
//   // Gemini payload parameters (contents, systemInstruction, config)
//   const response = await geminiClient.models.generateContent({
//     model: model,
//     contents: 'Explain quantum computing in one sentence.',
//     config: {
//       temperature: 0.7,
//       maxOutputTokens: 200,
//       systemInstruction: 'You are an experienced physics professor.'
//     }
//   });

//   console.log('Gemini Response:', response.text);
// }

// async function runGroqExample() {
//   const model = 'llama-3.3-70b-versatile';

//   // Groq payload parameters (messages array, temperature, max_tokens)
//   const chatCompletion = await groqClient.chat.completions.create({
//     model: model,
//     messages: [
//       { role: 'system', content: 'You are an experienced physics professor.' },
//       { role: 'user', content: 'Explain quantum computing in one sentence.' }
//     ],
//     temperature: 0.7,
//     max_completion_tokens: 200
//   });

//   console.log('Groq Response:', chatCompletion.choices[0]?.message?.content);
// }

// // ==========================================
// // Run both
// // ==========================================
// async function main() {
//   try {
//     await runGeminiExample();
//     await runGroqExample();
//   } catch (error) {
//     console.error('API Error:', error);
//   }
// }

// main();