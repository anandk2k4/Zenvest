import express from "express";
import { getChatHistory } from "../controllers/chatController.js";

const router = express.Router();

// Only allow fetching chat history
router.get("/chat", getChatHistory);

export default router;
