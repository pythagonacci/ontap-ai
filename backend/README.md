# Ontap AI Backend

Backend API and services for the Ontap AI application.

## Setup

This directory is ready for backend development. You can choose your preferred backend technology:

### Node.js/Express
```bash
npm init -y
npm install express cors dotenv
```

### Python/FastAPI
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn
```

### Other Options
- Go with Gin or Echo
- Rust with Actix-web
- Java with Spring Boot
- C# with ASP.NET Core

## Project Structure

```
backend/
├── src/              # Source code
├── tests/            # Test files
├── config/           # Configuration files
├── docs/             # API documentation
└── README.md         # This file
```

## API Endpoints

Define your API endpoints here as you develop them.

## Environment Variables

Create a `.env` file for your environment variables:

```env
PORT=3001
DATABASE_URL=your_database_url
API_KEY=your_api_key
```

## Development

Start your backend server and ensure it's running on a different port than the frontend (typically 3001 for backend, 3000 for frontend).
