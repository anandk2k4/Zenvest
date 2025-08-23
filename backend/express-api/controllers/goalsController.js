import Goal from "../models/Goal.js";

// 📌 Read-only: get all goals for a given user, with progress calculation
export const getGoals = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const goals = await Goal.find({ clerk_user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    //  Calculate progress for each goal
    const goalsWithProgress = goals.map((g) => {
        const current = g.currentAmount || 0;
        const target = g.targetAmount || 1; // avoid division by 0
        const progress = Math.min(100, Math.round((current / target) * 100));
  
        return {
          ...g,
          progress,
        };
      });
  
      res.json(goalsWithProgress);
    } catch (err) {
      console.error("Error fetching goals:", err);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  };
