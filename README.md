# QRForge - Dockerized QR Code Generator

A production-grade, privacy-first QR code generator web application. Self-hostable via Docker with zero external dependencies after deployment.

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB.svg)](https://react.dev)

## Features

- **QR Code Generation** from text, URLs, emails, phone numbers, WiFi credentials
- **Multiple Formats**: PNG, SVG, JPEG, WebP
- **Customization**: Size (256-2048px), colors, margins, error correction levels
- **REST API** with OpenAPI/Swagger documentation
- **Rate Limiting** and input validation
- **History** tracking (in-memory, optional)
- **Dark Mode** support
- **Responsive UI** - works on desktop and mobile
- **Health Checks** for container monitoring

## Quick Start

```bash
# Clone or navigate to the project
cd qrforge

# Copy environment file
cp .env.example .env

# Start with Docker Compose
docker compose up -d

# Access the application
open http://localhost:3000
```

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │──────▶  Nginx      │──────▶  FastAPI    │
│             │      │  (Frontend) │      │  (Backend)  │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                                                  ▼
                                           ┌─────────────┐
                                           │   QR Code   │
                                           │   Service   │
                                           └─────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/qr/generate` | POST | Generate QR code |
| `/api/v1/qr/history` | GET | Get generation history |
| `/api/v1/qr/history` | DELETE | Clear history |
| `/api/v1/qr/validate` | GET | Validate content |
| `/docs` | GET | Swagger UI documentation |

### Generate QR Code

```bash
curl -X POST http://localhost:8080/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "https://example.com",
    "size": 512,
    "format": "png",
    "ecc": "M",
    "fg_color": "#000000",
    "bg_color": "#ffffff",
    "margin": 4
  }'
```

Response:
```json
{
  "success": true,
  "download_url": "/generated/abc123.png",
  "filename": "abc123.png",
  "generated_at": "2024-01-15T10:30:00"
}
```

## Configuration

Environment variables (set in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | 8080 | Backend API port |
| `FRONTEND_PORT` | 3000 | Frontend port |
| `APP_ENV` | production | Environment mode |
| `ENABLE_HISTORY` | true | Enable history tracking |
| `MAX_PAYLOAD_SIZE` | 5000 | Max content length |
| `DEFAULT_QR_SIZE` | 512 | Default QR size |

## Development

### Backend Only

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Frontend Only

```bash
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Docker Commands

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v

# Scale backend (stateless)
docker compose up -d --scale backend=3
```

## Security

- Non-root container users
- Read-only root filesystem
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting (60 requests/minute)
- Input validation and sanitization
- CORS configuration
- No external API calls

## Platform Support

- Linux AMD64 / ARM64
- macOS (Docker Desktop)
- Windows (Docker Desktop)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Screenshots

| Generate | History | Settings |
|----------|---------|----------|
| Main QR generation interface with customization options | List of recently generated codes with download links | App preferences and default settings |

---

Built with FastAPI, React, Tailwind CSS, and Docker.
