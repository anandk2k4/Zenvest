import express from "express";
import cors from "cors";
import connectDB from "./db/mongodb.js";
import dotenv from "dotenv";
dotenv.config();

import dashboardRoutes from "./routes/dashboardRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import newsRoutes2 from "./routes/newsRoutes2.js";
import marketRoutes from "./routes/marketRoutes.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
connectDB();





// Routes
// ✅ API routes
app.use("/api", dashboardRoutes);
app.use("/api", goalsRoutes);
app.use("/api", chatRoutes);
app.use("/api", newsRoutes);
app.use("/api", newsRoutes2);
app.use("/api", marketRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
