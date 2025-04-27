import mongoose from "mongoose";
import fetch from "node-fetch";
import ChatSession from "../mongo/ChatSession.js";

function cleanContent(text) {
    if (!text) return '';
  
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')      // Remove **bold**
      .replace(/\\\((.*?)\\\)/g, '$1')       // Remove \( ... \)
      .replace(/\\\[.*?\\\]/gs, '')          // Remove \[ ... \]
      .replace(/\\boxed\{(.*?)\}/g, '$1')    // Remove \boxed{...}
      .replace(/```.*?```/gs, '')            // Remove code blocks
      .replace(/`(.*?)`/g, '$1')             // Remove inline backticks
      .replace(/\\times/g, '×')              // Replace \times with ×
      .replace(/\s+/g, ' ')                  // Collapse extra spaces
      .trim();
  }

export function groqHandler(modelName) {
  return async (req, res) => {
    const userMessage = req.body.message;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const result = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: userMessage }]
          })
        }
      );

      clearTimeout(timeout);

      if (!result.ok) {
        console.error(`[${modelName}] non-200 response:`, result.status, await result.text());
        return res.status(500).json({ reply: `Upstream error from ${modelName}` });
      }

      const json = await result.json();
      const content = json.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`[${modelName}] bad response:`, JSON.stringify(json, null, 2));
        return res.status(500).json({ reply: `No valid response from ${modelName}` });
      }

      console.log(`[${modelName}] got reply`);

      const finalUserId = req.session.userId
        ? new mongoose.Types.ObjectId(req.session.userId)
        : new mongoose.Types.ObjectId('000000000000000000000000'); // guest id

        const cleanedContent = cleanContent(content);

        await ChatSession.create({
          userId: finalUserId,
          prompt: userMessage,
          responses: [{
            model: modelName,
            content: cleanedContent,
          }]
        });

        res.json({ reply: cleanedContent });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`[${modelName}] timeout error:`, err);
        return res.status(504).json({ reply: `${modelName} timed out` });
      }
      console.error(`[${modelName}] error:`, err.stack || err);
      res.status(500).json({ reply: `Error calling ${modelName}` });
    }
  };
}
