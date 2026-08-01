const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require('../utils/authMiddleware');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");

// @desc    Chat with AI about security scan
// @route   POST /api/chat
router.post('/', protect, async (req, res) => {
  try {
    const { message, scanContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Gemini API Key missing. Please add GEMINI_API_KEY to your .env file." 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Cybersecurity AI Assistant for the "Cyber Guard" platform.
      Your goal is to explain phishing and scam threats to users in a non-technical, helpful way.
      
      CURRENT SCAN CONTEXT:
      Type: ${scanContext?.type || 'None'}
      Risk Level: ${scanContext?.riskLevel || 'Unknown'}
      Details Found: ${scanContext?.details?.join(', ') || 'No specific details'}
      Content Scanned: ${JSON.stringify(scanContext?.content || '')}

      USER QUESTION: "${message}"

      Provide a concise, professional, and reassuring response. 
      Focus on actionable security advice. If the scan context shows it is malicious, explain why simply.
    `;

    console.log(`Sending prompt to Gemini for user: ${req.user.username}`);
    
    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
      throw new Error("No response from Gemini API");
    }

    const responseText = result.response.text();
    console.log("Gemini response received");

    res.json({ text: responseText });
  } catch (err) {
    console.error('AI Chat Error Details:', {
      message: err.message,
      stack: err.stack,
      status: err.status
    });
    res.status(500).json({ error: `AI error: ${err.message}` });
  }
});

module.exports = router;
