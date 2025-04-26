import express from "express";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js'
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import ChatSession from "./mongo/ChatSession.js";
import exportTxtRouter from "./routes/exportTxt.js";
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

console.log("....server.js loading…");

app.get("/ping", (_req, res) => res.send("pong"));

// Session middleware || + optional session cookie option for security
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretKeyHere',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24  // 1 day
  }
}));

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to handle form submits
app.use("/api", exportTxtRouter);

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9s timeout

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

      console.log(`[${modelName}] reply →`, content);

      // Save the chat to MongoDB
      await ChatSession.create({
        userId: req.session.userId || "guest",
        prompt: userMessage,
        responses: [{
          model: modelName,
          content,
        }]
      });      

      // Send the successful response
      res.json({ reply: content });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`[${modelName}] timeout error:`, err);
        return res.status(504).json({ reply: `${modelName} timed out` });
      }
      console.error(`[${modelName}] error:`, err);
      res.status(500).json({ reply: `Error calling ${modelName}` });
    }
  };
}

// --------- AUTH ROUTES ---------

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.redirect('/login.html');
  } catch (err) {
    res.status(400).send('Registration error: ' + err.message);
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('User not found.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid password.');

  req.session.userId = user._id;
  res.redirect('/dashboard.html');
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login.html');
}

// Example: protect dashboard.html
app.get('/dashboard.html', isAuthenticated, (req, res, next) => {
  next(); // Let it serve static file if authenticated
});

// so frontend can check to see who is logged in
app.get('/api/whoami', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});

//for future use possibly, unused as of now
app.get("/api/history/:userId", async (req, res) => {
  try {
    const chats = await ChatSession.find({ userId: req.params.userId });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

textModels.forEach(({ route, model }) =>
  app.post(`/api/chat/${route}`, groqHandler(model))
);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "0.0.0.0", () =>
  console.log(`....Server listening on http://0.0.0.0:${PORT}`)
);

function shutdown(signal) {
  console.log(`${signal} received: shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('Uncaught Exception');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('Unhandled Rejection');
});
