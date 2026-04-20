# AI-Powered Phishing Link and Scam Detector

This is a premium MERN stack application designed to identify phishing URLs and scam messages using a combination of heuristic analysis and simulated AI pattern matching.

## Features
- **URL Scanner**: Deep analysis of URL structure, protocol, TLD, and domain keywords.
- **Message Analyzer**: Detects urgency, financial scams, impersonation, and aggressive formatting.
- **Risk Assessment**: Generates a risk score (0-100) and provides detailed security insights.
- **History Dashboard**: Keeps track of previous scans for auditing.
- **Premium UI**: Modern dark-mode interface with glassmorphism and smooth animations.

## Tech Stack
- **Frontend**: React, Vite, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (with in-memory fallback).

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (optional, app will run with in-memory storage if not detected)

### Installation

1. **Clone/Download** the project.
2. **Setup Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Design Decisions
- **Glassmorphism**: Used for a sophisticated, futuristic "cybersecurity" look.
- **Dynamic Background**: Subtle animated gradients to keep the interface feeling "alive".
- **Risk Gauge**: Visual representation of danger levels for immediate user comprehension.
- **In-Memory Fallback**: Ensures the application is usable even in environments without a pre-configured database.
