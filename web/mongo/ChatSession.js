import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const chatSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User' },
  prompt: String,
  responses: [{
    model: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    tags: [String]
  }],
  createdAt: { type: Date, default: Date.now }
});

chatSchema.index({ userId: 1 });
chatSchema.index({ 'responses.tags': 1 });

const ChatSession = mongoose.model("ChatSession", chatSchema);
export default ChatSession;
