import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname)); //remove if you try to run index from another file
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html")); //redundant if you run express static
});

// ---- Groq Chat Handlers ----
function groqHandler(modelName) {
  return async (req, res) => {
    const userMessage = req.body.message;

    try {
      const result = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: userMessage }]
        })
      });

      const json = await result.json();
      console.log(`[${modelName}] Response:`, JSON.stringify(json, null, 2));

      if (!json.choices || !json.choices[0]) {
        return res.status(500).json({ reply: `No choices returned from ${modelName}` });
      }

      res.json({ reply: json.choices[0].message.content });
    } catch (err) {
      console.error(`[${modelName}] Groq error:`, err);
      res.status(500).json({ reply: `Error calling model ${modelName}` });
    }
  };
}

// ---- Add Supported Routes ----
app.post("/api/chat/llama3-8b", groqHandler("llama3-8b-8192"));
app.post("/api/chat/llama3-70b", groqHandler("llama3-70b-8192"));
app.post("/api/chat/gemma2-9b", groqHandler("gemma2-9b-it"));
app.post("/api/chat/llama3.1-8b", groqHandler("llama-3.1-8b-instant"));
app.post("/api/chat/llama3.3-70b", groqHandler("llama-3.3-70b-versatile"));

console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
app.listen(3000, () => console.log("Web server running on port 3000"));
