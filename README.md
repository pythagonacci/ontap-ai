# Ontap AI - Chrome Extension

> **Access ChatGPT on any page as a transparent overlay. No more switching tabs.**

Ontap AI is a powerful Chrome extension that brings AI assistance directly to your browser. With a sleek command palette interface, you can get instant help with text explanation, rephrasing, and answering questions without leaving your current webpage.

## Features

- **Seamless Integration** - Works on any website with a transparent overlay
- **Instant Access** - Press `Alt+K` to open the command palette anywhere
- **AI-Powered** - Powered by OpenAI's GPT models for intelligent responses
- **Privacy-Focused** - Minimal data collection, no personal information stored
- **Beautiful UI** - Modern, responsive design that doesn't interfere with your browsing

## Quick Start

### For End Users (Install Extension)

1. **Download the Extension**
   - Download `ontap-ai-secure-installer.zip` from the releases
   - Or clone this repository and follow the build instructions below

2. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top right)
   - Click **"Load unpacked"**
   - Select the unzipped `dist` folder
   - Extension is now installed and ready to use!

3. **Start Using**
   - Press `Alt+K` on any webpage to open the command palette
   - Type your question or select an action (explain, rephrase, answer)
   - Get instant AI assistance without leaving the page

### For Developers

#### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ (for backend)
- Chrome browser

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development mode
npm run build        # Production build
```

#### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-api-key-here"
export OPENAI_MODEL="gpt-4o-mini"  # Optional, defaults to gpt-4o-mini

# Run the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8787
```

#### Building the Extension
```bash
cd frontend
npm run build
# The dist/ folder contains your extension
```

## Development

### Project Structure
```
ontap-ai/
├── frontend/                 # Chrome extension frontend
│   ├── src/
│   │   ├── extension/       # Extension-specific code
│   │   │   ├── manifest.ts  # Extension manifest
│   │   │   ├── background.ts # Service worker
│   │   │   └── content.tsx  # Content script
│   │   └── CommandPalettePrototype.tsx
│   ├── dist/                # Built extension (after npm run build)
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py          # API endpoints
│   │   ├── openai_client.py # OpenAI integration
│   │   └── models.py        # Data models
│   └── requirements.txt
└── README.md
```

### Key Technologies
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Extension**: Chrome Extension Manifest V3, CRXJS
- **Backend**: FastAPI, Python, OpenAI API
- **Build**: Vite, TypeScript compiler

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build extension for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o-mini
PORT=8787
CORS_ORIGINS=http://localhost:5173,chrome-extension://*
```

### Extension Permissions
The extension requests minimal permissions:
- **`activeTab`**: Access current webpage context when requested
- **Host permissions**: Communicate with the AI backend service

## Deployment

### Backend Deployment
The backend is designed to work with services like:
- **Render** (recommended for free tier)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

### Extension Distribution
1. **Chrome Web Store** (recommended for public distribution)
2. **Direct installation** using the installer zip
3. **GitHub releases** for developer distribution

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy & Security

- **No personal data stored** on our servers
- **Minimal data collection** - only what's necessary for functionality
- **HTTPS encryption** for all communications
- **OpenAI API integration** follows their privacy standards
- **Chrome extension best practices** for security

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ontap-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ontap-ai/discussions)
- **Email**: aahmadamna@gmail.com

---

**Made with ❤️ for a better browsing experience**
