import Chat from "../models/Chat.js";

// 📌 Get latest 3 bot responses (title + description only)
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Get all chats for the user, newest first
    const chats = await Chat.find({ userId })
      .sort({ updated_at: -1 })
      .lean();

    if (!chats || chats.length === 0) {
      return res.json({ userId, aiInsights: [] });
    }

    // Flatten all messages into a single array
    const allMessages = chats.flatMap((c) => c.messages || []);

    // Filter only bot responses
    const botMessages = allMessages
      .filter((m) => m.role === "bot")
      .map((m) => ({
        title: m.response?.title || "AI Suggestion",
        description: m.response?.description || m.text || "No response available",
      }));

    // Get the last 3
    const last3 = botMessages.slice(-3).reverse(); // newest first

    res.json({
      userId,
      aiInsights: last3,
      updated_at: chats[0].updated_at,
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};
