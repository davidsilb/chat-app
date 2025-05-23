import express from 'express';
const router = express.Router();

import isAuthenticated from '../middleware/isAuthenticated.js';
import ChatSession from '../mongo/ChatSession.js';

function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

router.get('/search', isAuthenticated, async (req, res) => {
  const { keyword } = req.query;
  const userId = req.session.userId;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid keyword' });
  }

  const escapedKeyword = escapeRegex(keyword);

  try {
    const results = await ChatSession.find({
      userId,
      $or: [
        { prompt: { $regex: escapedKeyword, $options: 'i' } },
        { 'responses.content': { $regex: escapedKeyword, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    console.error('Keyword search error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;