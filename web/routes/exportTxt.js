// routes/exportTxt.js
import express from "express";
import fs from "fs";
import path from "path";
import ChatSession from "../mongo/ChatSession.js";  // Make sure this import is correct

const router = express.Router();

const exportDir = path.join(process.cwd(), "exports");
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);  // Ensure export folder exists
}

// Route to export chat data to TXT file
router.post("/export/txt", async (req, res) => {
  const { responses, userId, prompt } = req.body;

  // Validation of request data
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    // Save to MongoDB
    await ChatSession.create({
      userId: userId,  // Ensure userId is passed in the request body
      prompt: prompt,  // Ensure prompt is passed in the request body
      responses: responses.map((r) => ({
        model: r.ai,    // AI model name
        question: r.question,  // User's question
        response: r.response,  // AI response
      })),
    });
  } catch (err) {
    console.error("Error saving to DB:", err);
    return res.status(500).json({ error: "Failed to save session to DB" });
  }

  // Generate content for the TXT file
  const content = responses
    .map(
      (r) =>
        `--- Model: ${r.ai} ---\nPrompt: ${r.question}\nResponse:\n${r.response}\n\n`
    )
    .join("");

  const fileName = `chat-export-${Date.now()}.txt`;
  const filePath = path.join(exportDir, fileName);

  // Write to TXT file
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("TXT export error:", err);
      return res.status(500).json({ error: "Failed to export TXT" });
    }

    // Send the file as a download
    res.download(filePath, fileName);
  });
});

export default router;

