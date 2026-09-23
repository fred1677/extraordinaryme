// File: /Users/fredliu/extraordinaryme/backend/engine/taoengine.js

/**
 * ============================================================================
 * MODULE: /backend/engine/taoengine.js
 * 
 * FUNCTION: 
 * The Universal AI Engine Router. Acts as a secure, server-side bridge 
 * between the TAO OS frontend and external AI providers (currently Groq). 
 * It keeps API keys hidden from the browser and standardizes the request and 
 * response formatting for the frontend chat interfaces.
 * 
 * USAGE SYNTAX:
 * // In server.js:
 * const taoEngine = require('./src/modules/tao/taoengine');
 * app.use('/api/chat', taoEngine);
 * 
 * // Frontend fetch example:
 * fetch('/api/chat', { 
 *    method: 'POST', 
 *    headers: { 'Content-Type': 'application/json' },
 *    body: JSON.stringify({ message: "Hello AI", model: "llama3-8b-8192" }) 
 * });
 * ============================================================================
 * 
 * ARCHITECTURE DETAILS:
 * - Security: Extracts the GROQ_API_KEY from the hidden .env file so it is 
 *   never exposed to the client-side browser.
 * - Extensibility: Currently hardcoded for the Groq SDK, but designed as a 
 *   central dispatcher. Future updates can map different models to different 
 *   providers seamlessly without changing the frontend logic.
 * ============================================================================
 */

const express = require('express');
const Groq = require('groq-sdk');
const router = express.Router();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

router.post('/', async (req, res) => {
    // Allows the frontend to request a specific model, defaults if none provided
    const { message, model = 'openai/gpt-oss-20b' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'A message payload is required.' });
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: message }],
            model: model,
        });

        res.json({ reply: completion.choices[0].message.content });
        
    } catch (error) {
        console.error('Groq API error:', error);
        res.status(500).json({ error: 'Failed to communicate with AI provider.' });
    }
});

module.exports = router;