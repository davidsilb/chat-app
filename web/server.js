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

//
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const json = await result.json();
    res.json({ reply: json.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ reply: "Error talking to AI." });
  }
});

app.listen(3000, () => console.log("✅ Web server running on port 3000"));
