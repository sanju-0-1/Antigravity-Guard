require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Scan = require('./models/Scan');
const { analyzeURL, analyzeText, analyzeWhatsApp } = require('./utils/analyzer');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { protect } = require('./utils/authMiddleware');

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Memory storage fallback
let scans = [];

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error. Falling back to in-memory storage.');
  });

// Routes
app.post('/api/scan', protect, async (req, res) => {
  try {
    const { type, content } = req.body;
    
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    let analysisResults;
    if (type === 'url') {
      analysisResults = analyzeURL(content);
    } else if (type === 'whatsapp') {
      analysisResults = analyzeWhatsApp(content);
    } else {
      analysisResults = analyzeText(content);
    }

    const scanData = {
      userId: req.user ? req.user._id : 'guest',
      type,
      content,
      ...analysisResults,
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const newScan = new Scan(scanData);
      await newScan.save();
      res.status(201).json(newScan);
    } else {
      const fallbackScan = { ...scanData, _id: Date.now().toString() };
      scans.unshift(fallbackScan);
      res.status(201).json(fallbackScan);
    }
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Server error during analysis: ' + (err.message || 'Unknown error') });
  }
});

app.post('/api/report/:id', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const scan = await Scan.findById(req.params.id);
      if (!scan) return res.status(404).json({ error: 'Scan not found' });
      
      scan.reportedByCommunity = true;
      scan.reportCount += 1;
      await scan.save();
      res.json({ success: true, reportCount: scan.reportCount });
    } else {
      res.json({ success: true, message: 'Fallback: Scan reported in memory' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to report scan' });
  }
});

app.post('/api/scan-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // OCR Analysis
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      { logger: m => console.log(m) }
    );

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from image' });
    }

    const analysisResults = analyzeText(text);

    const scanData = {
      userId: req.user ? req.user._id : 'guest',
      type: 'text', // Log it as text for historical consistency
      content: `[Extracted from Image]: ${text.substring(0, 100)}...`,
      ...analysisResults,
      createdAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const newScan = new Scan(scanData);
      await newScan.save();
      res.status(201).json({ ...newScan.toObject(), extractedText: text });
    } else {
      const fallbackScan = { ...scanData, _id: Date.now().toString() };
      scans.unshift(fallbackScan);
      res.status(201).json({ ...fallbackScan, extractedText: text });
    }
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'Server error during OCR analysis' });
  }
});

app.get('/api/history', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1 && req.user?._id) {
      const history = await Scan.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
      res.json(history);
    } else {
      res.json(scans.slice(0, 10));
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
