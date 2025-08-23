import mongoose from "mongoose";

// ----------------------------
// Message schema
// ----------------------------
const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ["user", "bot"] },
    text: { type: String, default: null },
    response: { type: Object, default: null }, // can hold AI reply object
  },
  { _id: false } // don't create separate _id for each message
);

// ----------------------------
// Chat schema (history)
// ----------------------------
const ChatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    messages: { type: [MessageSchema], default: [] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "chat_history" } // ✅ match FastAPI's Mongo collection
);

export default mongoose.model("Chat", ChatSchema);
