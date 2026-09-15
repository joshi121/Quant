import express from "express";
import { 
  getNewsController, 
  syncNewsController, 
  summarizeNewsController,
  deleteSummaryController,
  getBlinkNewsController
} from "../controllers/newsControllor.js";

const router = express.Router();

// GET /api/news?category=AI
router.get("/", getNewsController);

// GET /api/news/blinknews
router.get("/blinknews", getBlinkNewsController);

// POST /api/news/summarize/:newsId
router.post("/summarize/:newsId", summarizeNewsController);

// DELETE /api/news/summary/:newsId
router.delete("/summary/:newsId", deleteSummaryController);

// POST /api/news/sync
router.post("/sync", syncNewsController);

export default router;



