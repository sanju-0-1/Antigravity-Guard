/**
 * Advanced Multi-Engine Analysis System
 * Implements Multi-engine detection & Explainable AI
 * Focused on non-technical, user-friendly language.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const analyzeWithAI = async (type, content, heuristicResult) => {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return heuristicResult;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Cybersecurity AI Assistant for "Cyber Guard".
      Analyze the following ${type} content scanned by a user.
      CONTENT TO ANALYZE: "${content}"

      Perform 3 tasks:
      1. Explain in 1-2 simple non-technical sentences what this ${type} (link, message, or image OCR text) is about.
      2. Evaluate if it is Safe, Suspicious, or Malicious and assign a risk score (0 = completely safe, 100 = definitely malicious).
      3. Write a vivid 1-2 sentence real-world analogy/example tailored specifically to this scanned content so that non-technical people (like elderly family members) can easily understand why it is safe or dangerous.

      Return your response STRICTLY as a JSON object with this exact schema:
      {
        "riskScore": number (0 to 100),
        "riskLevel": "Safe" | "Suspicious" | "Malicious",
        "about": "Clear sentence explaining what the content is about",
        "details": ["Point 1 explaining safety or threat details", "Point 2 explaining what it is"],
        "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
        "example": "A custom 1-2 sentence real-world analogy/example written by AI explaining this specific scan in everyday terms."
      }
    `;

    const result = await model.generateContent(prompt);
    const aiData = JSON.parse(result.response.text());

    const isSafe = (aiData.riskScore === 0) || (aiData.riskLevel === 'Safe');

    const details = [
      aiData.about ? `[Content Analysis]: ${aiData.about}` : null,
      ...(aiData.details || []),
      ...(heuristicResult.details || [])
    ].filter(Boolean);

    // Deduplicate details
    const uniqueDetails = Array.from(new Set(details));

    const recommendations = isSafe ? [
      'The message appears safe based on our current analysis.',
      'Continue using normal caution when interacting with emails or messages.',
      'Verify the sender if the request is unexpected or involves sensitive information.',
      'Never share passwords or one-time verification codes.'
    ] : [
      'Do not click suspicious links.',
      'Do not download unexpected attachments.',
      'Do not provide passwords or personal information.',
      'Report or delete the message if confirmed malicious.'
    ];

    return {
      riskScore: typeof aiData.riskScore === 'number' ? aiData.riskScore : heuristicResult.riskScore,
      riskLevel: aiData.riskLevel || heuristicResult.riskLevel,
      details: uniqueDetails,
      engineBreakdown: {
        "Gemini AI Intelligence": isSafe ? 0 : (aiData.riskScore || 0),
        ...heuristicResult.engineBreakdown
      },
      recommendations,
      example: aiData.example || null
    };
  } catch (err) {
    console.error('AI Analysis fallback to heuristics:', err.message);
    return heuristicResult;
  }
};

const analyzeURL = async (url) => {
  try {
    let formattedUrl = url ? url.trim() : '';
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }
    const urlObj = new URL(formattedUrl);
    const engines = [
      structuralEngine(urlObj),
      domainReputationEngine(urlObj),
      logicHeuristicEngine(urlObj)
    ];

    const heuristicResult = consolidateEngines(engines, 'url');
    return await analyzeWithAI('url', url, heuristicResult);
  } catch (err) {
    const fallback = {
      riskScore: 100,
      riskLevel: 'Malicious',
      details: ['The web address is broken or written in a very strange way.'],
      recommendations: ['Critical: Do not click. This link is broken or faked to trick your browser.'],
      engineBreakdown: { "Security Engine": 100 }
    };
    return await analyzeWithAI('url', url, fallback);
  }
};

const analyzeText = async (text) => {
  const engines = [
    sentimentEngine(text),
    impersonationEngine(text),
    urgencyEngine(text)
  ];

  const heuristicResult = consolidateEngines(engines, 'text');
  return await analyzeWithAI('text', text, heuristicResult);
};

const analyzeWhatsApp = async (text) => {
  const content = text.toLowerCase();
  const engines = [
    sentimentEngine(text),
    urgencyEngine(text),
    // WhatsApp Specific Engine
    (() => {
      const details = [];
      let score = 0;
      
      const waPatterns = [
        { kw: 'verification code', msg: 'Someone might be trying to take over your WhatsApp account by asking for your code.', weight: 45 },
        { kw: 'wa.me', msg: 'The message contains a shortcut link that might skip usual security checks.', weight: 20 },
        { kw: 'otp', msg: 'Warning: This message is asking for a one-time password. Never share these codes!', weight: 50 },
        { kw: 'official whatsapp', msg: 'This message is pretending to be from WhatsApp itself, which is a common trick.', weight: 35 },
        { kw: 'vcard', msg: 'A "contact card" is attached. These can sometimes hide malicious website links.', weight: 25 }
      ];

      waPatterns.forEach(p => {
        if (content.includes(p.kw)) {
          details.push(p.msg);
          score += p.weight;
        }
      });

      return { name: 'Chat Security', score, details };
    })()
  ];

  const heuristicResult = consolidateEngines(engines, 'whatsapp');
  return await analyzeWithAI('whatsapp', text, heuristicResult);
};

// --- ENGINES (Non-IT Explanations) ---

const structuralEngine = (urlObj) => {
  const details = [];
  let score = 0;

  if (urlObj.protocol !== 'https:') {
    details.push('This website is not "private." Any info you type could be seen by hackers.');
    score += 35;
  }
  if (urlObj.hostname.split('.').length > 3) {
    details.push('The link looks very "messy" and long, which is a trick used to hide the real website.');
    score += 20;
  }
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(urlObj.hostname)) {
    details.push('This uses numbers instead of a name (like google.com). Real businesses almost never do this.');
    score += 50;
  }

  return { name: 'Address Safety', score, details };
};

const domainReputationEngine = (urlObj) => {
  const details = [];
  let score = 0;

  const suspiciousTLDs = ['.xyz', '.zip', '.top', '.icu', '.link', '.click', '.tk', '.ml'];
  if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
    details.push(`The ending of this link (.${urlObj.hostname.split('.').pop()}) is very rarely used by safe websites.`);
    score += 25;
  }

  const brands = ['login', 'verify', 'account', 'banking', 'secure', 'paypal', 'microsoft', 'google', 'amazon'];
  if (brands.some(kw => urlObj.hostname.toLowerCase().includes(kw))) {
    details.push('The link is trying to look like a famous website or an "Official Login" page to trick you.');
    score += 30;
  }

  return { name: 'Identity Check', score, details };
};

const logicHeuristicEngine = (urlObj) => {
  const details = [];
  let score = 0;
  
  if (urlObj.href.includes('@')) {
    details.push('The link is using special symbols to hide where it is really taking you.');
    score += 60;
  }
  if (urlObj.hostname.length > 50) {
    details.push('The link address is way too long, likely trying to hide the real destination name.');
    score += 15;
  }

  return { name: 'Smart Scanner', score, details };
};

const sentimentEngine = (text) => {
  const details = [];
  let score = 0;
  const content = text.toLowerCase();

  const triggers = [
    { kw: 'refund', msg: 'It promises you a "refund" or money, which is a common bait to get your details.', weight: 20 },
    { kw: 'gift card', msg: 'It asks for "gift cards." Real companies will never ask you to pay or verify with gift cards.', weight: 45 },
    { kw: 'congratulations', msg: 'It says "Congratulations!" to make you excited so you click without thinking.', weight: 20 }
  ];

  triggers.forEach(t => {
    if (content.includes(t.kw)) {
      details.push(t.msg);
      score += t.weight;
    }
  });

  return { name: 'Trust Scanner', score, details };
};

const urgencyEngine = (text) => {
  const details = [];
  let score = 0;
  const content = text.toLowerCase();

  const triggers = [
    { kw: 'immediately', msg: 'It uses "Urgent" language to scare you into acting too quickly.', weight: 30 },
    { kw: 'suspended', msg: 'It threatens that your account is "locked" or "suspended" to cause panic.', weight: 35 },
    { kw: 'unauthorized', msg: 'It claims someone else logged into your account to make you worried.', weight: 25 }
  ];

  triggers.forEach(t => {
    if (content.includes(t.kw)) {
      details.push(t.msg);
      score += t.weight;
    }
  });

  return { name: 'Pressure Detector', score, details };
};

const impersonationEngine = (text) => {
  const details = [];
  let score = 0;
  const content = text.toLowerCase();

  if (content.includes('official') && (content.includes('support') || content.includes('team'))) {
    details.push('It claims to be from "Official Support," which is a common way scammers gain trust.');
    score += 30;
  }

  return { name: 'Faker Finder', score, details };
};

// --- CORE UTILS ---

const consolidateEngines = (engines, type) => {
  const details = [];
  const engineBreakdown = {};
  let totalScore = 0;

  engines.forEach(engine => {
    if (engine.score > 0) {
      engineBreakdown[engine.name] = engine.score;
      totalScore += engine.score;
      details.push(...engine.details);
    }
  });

  const riskScore = Math.min(totalScore, 100);
  
  let riskLevel = 'Safe';
  if (riskScore >= 70) riskLevel = 'Malicious';
  else if (riskScore >= 30) riskLevel = 'Suspicious';

  if (riskScore === 0 || details.length === 0) {
    details.length = 0;
    details.push('No common phishing indicators were detected during analysis. The message does not contain suspicious links, credential requests, impersonation attempts, or other common phishing techniques.');
  }

  return {
    riskScore,
    riskLevel,
    details,
    engineBreakdown,
    recommendations: getRecommendations(riskLevel, type, riskScore)
  };
};

const getRecommendations = (riskLevel, type, riskScore = 0) => {
  if (riskScore === 0 || riskLevel === 'Safe') {
    return [
      'The message appears safe based on our current analysis.',
      'Continue using normal caution when interacting with emails or messages.',
      'Verify the sender if the request is unexpected or involves sensitive information.',
      'Never share passwords or one-time verification codes.'
    ];
  }

  return [
    'Do not click suspicious links.',
    'Do not download unexpected attachments.',
    'Do not provide passwords or personal information.',
    'Report or delete the message if confirmed malicious.'
  ];
};

module.exports = { analyzeURL, analyzeText, analyzeWhatsApp };
