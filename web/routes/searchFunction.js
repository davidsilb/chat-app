import express from 'express';
const router = express.Router();

import isAuthenticated from '../middleware/isAuthenticated.js';
import ChatSession from '../mongo/ChatSession.js';

router.get('/search', isAuthenticated, async (req, res) => {
  const { keyword } = req.query;
  const userId = req.session.userId;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    const results = await ChatSession.find({
      userId,
      $or: [
        { prompt: { $regex: keyword, $options: 'i' } },
        { 'responses.content': { $regex: keyword, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    console.error('Keyword search error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;