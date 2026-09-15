import express from "express";
import { 
  analyzeStockImpactController, 
  getStockIntelligenceController,
  deleteStockAnalysisController
} from "../controllers/stockControllor.js";

const router = express.Router();

// POST /api/stock/analyze/:newsId
router.post("/analyze/:newsId", analyzeStockImpactController);

// GET /api/stock/intelligence
router.get("/intelligence", getStockIntelligenceController);

// DELETE /api/stock/analysis/:newsId
router.delete("/analysis/:newsId", deleteStockAnalysisController);

export default router;
