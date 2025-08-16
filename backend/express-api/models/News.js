// models/News.js
const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true, unique: true },
  urlToImage: { type: String },
  publishedAt: { type: Date, required: true },
  publisher: { type: String },
  category: { 
    type: String, 
    enum: ["Crypto", "Stocks", "Investment", "All"], // <-- Added enum for clarity
    default: "All" 
  },
  subCategories: [{ type: String }]
}, {
  timestamps: true
});

// Index for faster queries
NewsSchema.index({ publishedAt: -1 });
NewsSchema.index({ category: 1 }); // <-- Added index for category
NewsSchema.index({ subCategories: 1 });

module.exports = mongoose.model("News", NewsSchema);
