import mongoose from "mongoose";
import fetch from "node-fetch";
import ChatSession from "../mongo/ChatSession.js";


export function groqHandler(modelName) {
  return async (req, res) => {
    const userMessage = req.body.message;

    const controller = new AbortController();
    let userTimeout = parseInt(req.body.timeout, 10);
    if (isNaN(userTimeout) || userTimeout < 5 || userTimeout > 30) {
      userTimeout = 10;
    }
    console.log(`[groqHandler.js]: [${modelName}] TIMEOUT set to: ${userTimeout} seconds`);
    const timeout = setTimeout(() => controller.abort(), userTimeout * 1000);

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

      console.log(`[groqHandler.js] -> [${modelName}] got reply`);

      let finalUserId;
      try {
        finalUserId = req.session.userId
          ? new mongoose.Types.ObjectId(req.session.userId)
          : new mongoose.Types.ObjectId('000000000000000000000000');
      } catch (e) {
        console.error(`caught error after let finalUserId - [${modelName}] invalid userId, using guest id:`, e.stack || e.message || e);
        finalUserId = new mongoose.Types.ObjectId('000000000000000000000000');
      }

        const saved = await ChatSession.create({
          userId: finalUserId,
          prompt: userMessage,
          responses: [{
            model: modelName,
            content: content,
          }]
        });
        const responseId = saved.responses[0]._id;
        res.json({ reply: content, chatSessionId: saved._id, responseId });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`[${modelName}] timeout error:`, err.stack || err.message || err);
        return res.status(504).json({ reply: `${modelName} timed out` });
      }
    
      console.error(`[${modelName}] error:`, err.stack || err.message || err);
      res.status(500).json({ reply: `Error calling ${modelName}` });
    }
  };
}
