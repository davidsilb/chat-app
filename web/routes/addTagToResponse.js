import express from 'express';
import ChatSession from '../mongo/ChatSession.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
      console.log('Received tag request body:', req.body);
      const { chatSessionId, responseId, tag } = req.body;
  
      const session = await ChatSession.findById(chatSessionId);
      if (!session) return res.status(404).send("Session not found");
  
      const response = session.responses.id(responseId);
      if (!response) return res.status(404).send("Response not found");
  
      response.tags = response.tags || [];
      if (!response.tags.includes(tag)) {
        response.tags.push(tag);
      }
  
      await session.save();
      res.sendStatus(200);
    } catch (err) {
      console.error("Error tagging response:", err);
      res.status(500).send("Failed to save tag.");
    }
  });

export default router;
