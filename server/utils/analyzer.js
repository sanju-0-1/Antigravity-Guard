/**
 * Advanced Multi-Engine Analysis System
 * Implements Multi-engine detection & Explainable AI
 * Focused on non-technical, user-friendly language.
 */

const analyzeURL = (url) => {
  try {
    const urlObj = new URL(url);
    const engines = [
      structuralEngine(urlObj),
      domainReputationEngine(urlObj),
      logicHeuristicEngine(urlObj)
    ];

    return consolidateEngines(engines, 'url');
  } catch (err) {
    return {
      riskScore: 100,
      riskLevel: 'Malicious',
      details: ['The web address is broken or written in a very strange way.'],
      recommendations: ['Critical: Do not click. This link is broken or faked to trick your browser.'],
      engineBreakdown: { "Security Engine": 100 }
    };
  }
};

const analyzeText = (text) => {
  const engines = [
    sentimentEngine(text),
    impersonationEngine(text),
    urgencyEngine(text)
  ];

  return consolidateEngines(engines, 'text');
};

const analyzeWhatsApp = (text) => {
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

  return consolidateEngines(engines, 'whatsapp');
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

  if (details.length === 0) details.push('The scanner didn\'t find any common tricks in this message.');

  return {
    riskScore,
    riskLevel,
    details,
    engineBreakdown,
    recommendations: getRecommendations(riskLevel, type)
  };
};

const getRecommendations = (riskLevel, type) => {
  const base = {
    Safe: [
      'Even if it looks safe, always double-check the sender\'s name.',
      'Never give out passwords, even if the message seems friendly.'
    ],
    Suspicious: [
      'Be very careful. Don\'t type any personal info or passwords.',
      'Go to the real website yourself instead of clicking this link.',
      'Check if the person sending this really who they say they are.'
    ],
    Malicious: [
      'STOP: Do not click and do not reply.',
      'Delete this message and block the sender immediately.',
      'Remember: Real companies will never ask for your secrets via a message.'
    ]
  };

  const specific = {
    whatsapp: ['Block this phone number on WhatsApp.', 'Tell your friends so they don\'t get tricked too.'],
    url: ['Close the tab immediately.', 'Do not download anything if the page opens.'],
    text: ['Ignore the threats in this message.', 'Delete this to stay safe.']
  };

  return [...base[riskLevel], ...(specific[type] || [])];
};

module.exports = { analyzeURL, analyzeText, analyzeWhatsApp };
