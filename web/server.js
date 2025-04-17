import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files (like styles, images if needed)
app.use(express.static(__dirname));
app.use(express.json());

// Serve the index.html file when the root URL is accessed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve the alternative index2.html file when the /alt URL is accessed
app.get("/alt", (req, res) => {
  res.sendFile(path.join(__dirname, "index2.html"));
});

// Chat API handler
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const result = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // or "mixtral-8x7b", "gemma-7b-it"
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const json = await result.json();

    // Debug raw output
    console.log("Groq raw response:", JSON.stringify(json, null, 2));

    if (!json.choices || !json.choices[0]) {
      console.error("Groq API response error:", JSON.stringify(json, null, 2));
      return res.status(500).json({ reply: "Groq API error: No choices returned." });
    }

    res.json({ reply: json.choices[0].message.content });
  } catch (err) {
    console.error("Error from Groq:", err);
    res.status(500).json({ reply: "Error talking to AI Groq." });
  }
});

// Start server
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
app.listen(3000, () => console.log("Web server running on port 3000"));
