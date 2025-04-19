import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

console.log("....server.js loading…");

app.get("/ping", (_req, res) => res.send("pong"));

app.use(express.static(__dirname));
app.use(express.json());

const textModels = [
  { route: "compound-beta-mini", model: "compound-beta-mini" },
  {
    route: "meta-llama_llama-4-maverick-17b-128e-instruct",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct"
  },
  { route: "qwen-qwq-32b", model: "qwen-qwq-32b" },
  { route: "llama3-8b-8192", model: "llama3-8b-8192" },
  { route: "gemma2-9b-it", model: "gemma2-9b-it" },
  {
    route: "deepseek-r1-distill-llama-70b",
    model: "deepseek-r1-distill-llama-70b"
  },
  { route: "llama3-70b-8192", model: "llama3-70b-8192" },
  { route: "mistral-saba-24b", model: "mistral-saba-24b" },
  { route: "compound-beta", model: "compound-beta" },
  { route: "llama-3.1-8b-instant", model: "llama-3.1-8b-instant" },
  {
    route: "llama-3.3-70b-versatile",
    model: "llama-3.3-70b-versatile"
  },
  {
    route: "meta-llama_llama-4-scout-17b-16e-instruct",
    model: "meta-llama/llama-4-scout-17b-16e-instruct"
  }
];

function groqHandler(modelName) {
  return async (req, res) => {
    const userMessage = req.body.message;
    try {
      const result = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
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
      const json = await result.json();
      console.log(`[${modelName}] reply →`, json.choices?.[0]?.message?.content);
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ reply: `No response from ${modelName}` });
      }
      res.json({ reply: content });
    } catch (err) {
      console.error(`[${modelName}] error:`, err);
      res.status(500).json({ reply: `Error calling ${modelName}` });
    }
  };
}

textModels.forEach(({ route, model }) =>
  app.post(`/api/chat/${route}`, groqHandler(model))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`....Server listening on http://0.0.0.0:${PORT}`)
);
