import express from 'express';
import ChatSession from '../mongo/ChatSession.js';

const router = express.Router();

router.post('/', async (req, res) => {
    console.log('Received tag request body:', req.body);
    const { chatSessionId, model, content, tag } = req.body;

  const result = await ChatSession.updateOne(
    {
      _id: chatSessionId,
      'responses.model': model,
      'responses.content': content
    },
    {
      $addToSet: { 'responses.$.tags': tag }
    }
  );

  if (result.modifiedCount > 0) {
    res.sendStatus(200);
  } else {
    res.status(404).send("Tag not added (response not found).");
  }
});

export default router;
