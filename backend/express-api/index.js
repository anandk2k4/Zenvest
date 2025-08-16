const express = require("express");
const cors = require("cors");
const connectDB = require("./db/mongodb");


const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const contactRoutes = require("./routes/contactRoutes");
const goalsRoutes = require("./routes/goalsRoutes");
const newsRoutes = require("./routes/newsRoutes");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
connectDB();


require("dotenv").config();

// Routes
app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/budget", budgetRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/goals", goalsRoutes);
// app.use("/api/news", newsRoutes);
app.use("/api", newsRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
