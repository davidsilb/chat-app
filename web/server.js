import express from "express";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js'
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import ChatSession from "./mongo/ChatSession.js";
import exportTxtRouter from "./routes/exportTxt.js";
import { groqHandler } from './routes/groqHandler.js';
try {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log("Print1 (bad logic here, so-> undefined) Connected to MongoDB:", conn.readyState);
  console.log("Print2 (good=1) Connected to MongoDB:", conn.connection.readyState);
  console.log("Print3 (good=1) Connected to MongoDB:", mongoose.connection.readyState);
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "exports")));
import addTagToResponse from './routes/addTagToResponse.js';
app.use('/api/addTagToResponse', addTagToResponse);

console.log("....server.js loading…");

// Fail early if no SESSION_SECRET in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error("SESSION_SECRET must be set in production!");
}


app.get("/ping", (_req, res) => res.send("pong"));

// Session middleware || + session cookie REQUIRED security
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24  // 1 day
  }
}));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
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
import isAuthenticated from './middleware/isAuthenticated.js';
// Protect searchpage.html from no login
app.get('/searchpage.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'searchpage.html'));
});
// Middleware to search for words and the birds
import searchRoutes from './routes/searchFunction.js';
app.use('/api', searchRoutes);

// protect dashboard.html
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

// so frontend can see name of user logging in
app.get('/api/whoaminame', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }

  try {
    const user = await User.findById(req.session.userId).select('username');
    if (!user) {
      return res.json({ loggedIn: false });
    }

    res.json({ loggedIn: true, username: user.username });
  } catch (err) {
    console.error('Error in /api/whoaminame:', err);
    res.status(500).json({ loggedIn: false, error: 'Server error' });
  }
});

// get history of chats for the user that is logged in
app.get('/api/history', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const chats = await ChatSession.find({
      userId: new mongoose.Types.ObjectId(req.session.userId)
    }).sort({ createdAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

// main code for grogHandler
textModels.forEach(({ route, model }) =>
  app.post(`/api/chat/${route}`, groqHandler(model))
);

// --------- CORE RUN & CLOSE ---------

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
