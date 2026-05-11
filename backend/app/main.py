"""
QRForge - FastAPI Backend for QR Code Generation
"""

import os
import uuid
import re
from datetime import datetime
from typing import Optional, Literal
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import qrcode
import qrcode.image.svg
from PIL import Image
import segno


# Configuration
APP_PORT = int(os.getenv("APP_PORT", 8080))
APP_ENV = os.getenv("APP_ENV", "production")
ENABLE_HISTORY = os.getenv("ENABLE_HISTORY", "true").lower() == "true"
MAX_PAYLOAD_SIZE = int(os.getenv("MAX_PAYLOAD_SIZE", 5000))
DEFAULT_QR_SIZE = int(os.getenv("DEFAULT_QR_SIZE", 512))
GENERATED_DIR = Path("/app/generated")
GENERATED_DIR.mkdir(exist_ok=True)

# FastAPI App
app = FastAPI(
    title="QRForge API",
    description="A production-grade QR code generation API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if APP_ENV == "development" else ["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated files
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")


# Pydantic Models
class QRGenerateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=MAX_PAYLOAD_SIZE, description="Content to encode in QR code")
    size: int = Field(default=DEFAULT_QR_SIZE, ge=64, le=2048, description="QR code size in pixels")
    format: Literal["png", "svg", "jpeg", "webp"] = Field(default="png", description="Output format")
    ecc: Literal["L", "M", "Q", "H"] = Field(default="M", description="Error correction level")
    fg_color: str = Field(default="#000000", description="Foreground color (hex)")
    bg_color: str = Field(default="#ffffff", description="Background color (hex)")
    margin: int = Field(default=4, ge=0, le=20, description="Margin around QR code")
    
    @validator("fg_color", "bg_color")
    def validate_hex_color(cls, v):
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError("Color must be a valid hex color (e.g., #000000)")
        return v


class QRGenerateResponse(BaseModel):
    success: bool
    download_url: str
    filename: str
    generated_at: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class HistoryItem(BaseModel):
    id: str
    content: str
    filename: str
    format: str
    generated_at: str


# In-memory history storage (replace with SQLite for persistence)
history_storage: list[HistoryItem] = []


# Helper functions
def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_ecc_level(level: str) -> int:
    """Get error correction constant from qrcode module."""
    levels = {
        "L": qrcode.constants.ERROR_CORRECT_L,
        "M": qrcode.constants.ERROR_CORRECT_M,
        "Q": qrcode.constants.ERROR_CORRECT_Q,
        "H": qrcode.constants.ERROR_CORRECT_H,
    }
    return levels.get(level, qrcode.constants.ERROR_CORRECT_M)


def generate_qr_pil(request: QRGenerateRequest) -> str:
    """Generate QR code using PIL (for PNG, JPEG, WebP)."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=get_ecc_level(request.ecc),
        box_size=10,
        border=request.margin,
    )
    qr.add_data(request.content)
    qr.make(fit=True)
    
    # Calculate box size to achieve desired output size
    modules = qr.modules_count
    box_size = max(1, request.size // (modules + 2 * request.margin))
    
    qr = qrcode.QRCode(
        version=None,
        error_correction=get_ecc_level(request.ecc),
        box_size=box_size,
        border=request.margin,
    )
    qr.add_data(request.content)
    qr.make(fit=True)
    
    # Generate image
    img = qr.make_image(fill_color=request.fg_color, back_color=request.bg_color)
    
    # Resize to exact size
    img = img.resize((request.size, request.size), Image.Resampling.LANCZOS)
    
    # Save
    filename = f"{uuid.uuid4().hex}.{request.format}"
    filepath = GENERATED_DIR / filename
    
    if request.format in ["jpeg", "webp"]:
        # Convert to RGB for formats that don't support transparency
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, hex_to_rgb(request.bg_color))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img
    
    img.save(filepath, format=request.format.upper())
    return filename


def generate_qr_svg(request: QRGenerateRequest) -> str:
    """Generate QR code as SVG using segno."""
    qr = segno.make(request.content, error=request.ecc.lower())
    
    filename = f"{uuid.uuid4().hex}.svg"
    filepath = GENERATED_DIR / filename
    
    qr.save(
        str(filepath),
        scale=request.size // (len(qr.matrix) + 2 * request.margin) or 1,
        border=request.margin,
        color=request.fg_color,
        background=request.bg_color,
    )
    return filename


def add_to_history(content: str, filename: str, format: str):
    """Add entry to history storage."""
    if ENABLE_HISTORY:
        item = HistoryItem(
            id=uuid.uuid4().hex,
            content=content[:100] + "..." if len(content) > 100 else content,
            filename=filename,
            format=format,
            generated_at=datetime.utcnow().isoformat(),
        )
        history_storage.insert(0, item)
        # Keep only last 50 items
        if len(history_storage) > 50:
            history_storage.pop()


# API Endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
    )


@app.post("/api/v1/qr/generate", response_model=QRGenerateResponse, tags=["QR Generation"])
@limiter.limit("60/minute")
async def generate_qr(request: Request, qr_request: QRGenerateRequest):
    """
    Generate a QR code with the specified parameters.
    
    - **content**: Text or URL to encode
    - **size**: Output size in pixels (64-2048)
    - **format**: Output format (png, svg, jpeg, webp)
    - **ecc**: Error correction level (L, M, Q, H)
    - **fg_color**: Foreground color as hex (e.g., #000000)
    - **bg_color**: Background color as hex (e.g., #ffffff)
    - **margin**: Border width (0-20)
    """
    try:
        if qr_request.format == "svg":
            filename = generate_qr_svg(qr_request)
        else:
            filename = generate_qr_pil(qr_request)
        
        add_to_history(qr_request.content, filename, qr_request.format)
        
        return QRGenerateResponse(
            success=True,
            download_url=f"/generated/{filename}",
            filename=filename,
            generated_at=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR generation failed: {str(e)}")


@app.get("/api/v1/qr/history", response_model=list[HistoryItem], tags=["History"])
@limiter.limit("100/minute")
async def get_history(request: Request, limit: int = Query(10, ge=1, le=50)):
    """Get recently generated QR codes (if history is enabled)."""
    if not ENABLE_HISTORY:
        return []
    return history_storage[:limit]


@app.delete("/api/v1/qr/history", tags=["History"])
@limiter.limit("10/minute")
async def clear_history(request: Request):
    """Clear history storage."""
    history_storage.clear()
    return {"success": True, "message": "History cleared"}


@app.get("/api/v1/qr/download/{filename}", tags=["QR Generation"])
async def download_qr(filename: str):
    """Download a generated QR code file."""
    filepath = GENERATED_DIR / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Validate filename to prevent directory traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    media_types = {
        "png": "image/png",
        "svg": "image/svg+xml",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "webp": "image/webp",
    }
    
    ext = filename.split(".")[-1].lower()
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=str(filepath),
        media_type=media_type,
        filename=filename,
    )


@app.get("/api/v1/qr/validate", tags=["Validation"])
async def validate_content(content: str):
    """Validate if content can be encoded in a QR code."""
    is_valid = len(content) > 0 and len(content) <= MAX_PAYLOAD_SIZE
    is_url = bool(re.match(r'^https?://', content, re.IGNORECASE))
    
    return {
        "valid": is_valid,
        "length": len(content),
        "is_url": is_url,
        "max_length": MAX_PAYLOAD_SIZE,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=APP_PORT)
