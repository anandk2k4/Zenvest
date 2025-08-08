const express = require("express");
const cors = require("cors");

const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const contactRoutes = require("./routes/contactRoutes");
const goalsRoutes = require("./routes/goalsRoutes");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/budget", budgetRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/goals", goalsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
