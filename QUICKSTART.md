# Song Master - Quick Start Guide

## Overview

Song Master now includes a modern web interface with FastAPI backend and React frontend for easy song generation and management.

## Architecture

- **Backend**: FastAPI with WebSocket support for real-time progress
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Features**: Real-time generation progress, song library, provider configuration

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm
- API keys for your chosen provider (Anthropic, OpenAI, or Google)

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and set your provider and API key:

```env
# Choose your provider
LLM_PROVIDER=anthropic

# Set your API key
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Backend configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_CONCURRENT_JOBS=3
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start the Backend Server

From the project root directory:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

### 5. Start the Frontend Development Server

In a separate terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at: http://localhost:5173

## Using the Web Interface

### Generate a Song

1. Navigate to http://localhost:5173
2. Enter your song description
3. Optionally set a song name and persona
4. Click "Generate Song"
5. Watch real-time progress as your song is created
6. Automatically redirected to the library when complete

### Browse Song Library

1. Click "Library" in the navigation
2. Search for songs by title or description
3. Click on any song to view full lyrics and metadata
4. Delete songs you no longer want

### Configure Provider

1. Click "Settings" in the navigation
2. Select your preferred provider (Anthropic, OpenAI, or Google)
3. Choose a model
4. Optionally update your API key
5. Click "Save Configuration"

## API Endpoints

### Generation
- `POST /api/generation/` - Start song generation
- `GET /api/generation/{job_id}/status` - Check job status
- `POST /api/generation/{job_id}/cancel` - Cancel job
- `WS /ws/{job_id}` - WebSocket for progress updates

### Songs Library
- `GET /api/songs/` - List all songs (with search/filter)
- `GET /api/songs/{song_id}` - Get song details
- `DELETE /api/songs/{song_id}` - Delete song

### Configuration
- `GET /api/config/` - Get current provider config
- `PUT /api/config/` - Update provider config

## CLI Usage (Still Supported)

The original CLI still works:

```bash
python song_master.py "Your song prompt here"
python song_master.py "Your song prompt here" --local
python song_master.py "Your song prompt here" --name "Song Title" --persona antidote
```

## Project Structure

```
song-master/
├── backend/                    # FastAPI backend
│   ├── main.py                 # FastAPI app
│   ├── models/                 # Pydantic models
│   ├── routers/                # API routes
│   └── services/               # Business logic
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # Page components
│   │   ├── store/              # State management
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── song_master.py              # Core generation logic
├── ai_functions.py             # AI provider integration
├── helpers.py                  # Utility functions
└── songs/                      # Generated songs
```

## Troubleshooting

### Backend won't start
- Check that port 8000 is not in use
- Verify all Python dependencies are installed
- Check `.env` file has valid configuration

### Frontend won't start
- Run `npm install` in the frontend directory
- Check that port 5173 is not in use
- Verify Node.js version is 18+

### WebSocket connection fails
- Ensure backend is running
- Check browser console for errors
- Verify CORS_ORIGINS includes your frontend URL

### Generation fails
- Check your API key is valid
- Verify you have sufficient API credits
- Check backend logs for detailed error messages

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Development
```bash
uvicorn backend.main:app --reload  # Auto-reload on changes
```

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

### Run Backend in Production
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Serve Frontend from Backend
Uncomment this line in `backend/main.py`:

```python
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
```

Then access everything at http://localhost:8000

## Support

- Report issues: https://github.com/frobinson47/song-master/issues
- Original repository: https://github.com/robertrittmuller/song-master
- Documentation: See README.md for detailed information

## License

MIT License - See LICENSE file for details
