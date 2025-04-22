import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: String,
  messages: [{
    role: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

chatSchema.index({ userId: 1 });
chatSchema.index({ "messages.timestamp": -1 });

const ChatSession = mongoose.model("ChatSession", chatSchema);
export default ChatSession;
