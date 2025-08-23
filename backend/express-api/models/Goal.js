import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema(
  {
    clerk_user_id: { type: String, required: true }, // Clerk user reference

    title: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "house",
        "retirement",
        "education",
        "investment",
        "emergency",
        "vacation",
        "vehicle",
        "debt",
        "other",
      ],
      required: true,
    },

    target_amount: { type: Number, required: true },  // targetAmount in frontend
    current_amount: { type: Number, default: 0 },     // currentAmount in frontend
    duration: { type: Number, required: true },
    description: { type: String, default: null },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "goals" }
);

// Add virtual field for progress_percentage
GoalSchema.virtual("progress_percentage").get(function () {
  if (!this.target_amount || this.target_amount === 0) return 0;
  return Math.round((this.current_amount / this.target_amount) * 100);
});

// Ensure virtuals show up in JSON
GoalSchema.set("toJSON", { virtuals: true });
GoalSchema.set("toObject", { virtuals: true });

export default mongoose.model("Goal", GoalSchema);
