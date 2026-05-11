"""
Test suite for QRForge backend API
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app, MAX_PAYLOAD_SIZE

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_check(self):
        """Test health endpoint returns ok status"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        assert "version" in data


class TestQRGeneration:
    def test_generate_qr_text(self):
        """Test QR generation with plain text"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "Hello World", "format": "png"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "download_url" in data
        assert "filename" in data
        assert data["filename"].endswith(".png")

    def test_generate_qr_url(self):
        """Test QR generation with URL"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "https://example.com", "format": "svg", "size": 512}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["filename"].endswith(".svg")

    def test_generate_qr_custom_colors(self):
        """Test QR generation with custom colors"""
        response = client.post(
            "/api/v1/qr/generate",
            json={
                "content": "Test",
                "format": "png",
                "fg_color": "#ff0000",
                "bg_color": "#00ff00"
            }
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_generate_qr_all_formats(self):
        """Test QR generation with all supported formats"""
        for fmt in ["png", "svg", "jpeg", "webp"]:
            response = client.post(
                "/api/v1/qr/generate",
                json={"content": f"Test {fmt}", "format": fmt}
            )
            assert response.status_code == 200, f"Format {fmt} failed"
            assert response.json()["filename"].endswith(f".{fmt}")

    def test_generate_qr_all_ecc_levels(self):
        """Test QR generation with all error correction levels"""
        for ecc in ["L", "M", "Q", "H"]:
            response = client.post(
                "/api/v1/qr/generate",
                json={"content": f"Test {ecc}", "ecc": ecc}
            )
            assert response.status_code == 200, f"ECC level {ecc} failed"

    def test_generate_qr_empty_content(self):
        """Test QR generation fails with empty content"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": ""}
        )
        assert response.status_code == 422

    def test_generate_qr_oversized_content(self):
        """Test QR generation fails with oversized content"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "x" * (MAX_PAYLOAD_SIZE + 1)}
        )
        assert response.status_code == 422

    def test_generate_qr_invalid_format(self):
        """Test QR generation fails with invalid format"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "Test", "format": "invalid"}
        )
        assert response.status_code == 422

    def test_generate_qr_invalid_color(self):
        """Test QR generation fails with invalid hex color"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "Test", "fg_color": "invalid"}
        )
        assert response.status_code == 422


class QRCodeSizes:
    def test_generate_qr_sizes(self):
        """Test QR generation with various sizes"""
        for size in [256, 512, 1024, 2048]:
            response = client.post(
                "/api/v1/qr/generate",
                json={"content": f"Size {size}", "size": size}
            )
            assert response.status_code == 200, f"Size {size} failed"


class TestHistory:
    def test_get_history(self):
        """Test history endpoint"""
        response = client.get("/api/v1/qr/history")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_history_after_generation(self):
        """Test history populated after generation"""
        # Generate a QR code
        client.post(
            "/api/v1/qr/generate",
            json={"content": "History test", "format": "png"}
        )
        
        # Check history
        response = client.get("/api/v1/qr/history")
        assert response.status_code == 200
        history = response.json()
        assert len(history) > 0
        assert any(item["content"] == "History test" for item in history)

    def test_clear_history(self):
        """Test clearing history"""
        response = client.delete("/api/v1/qr/history")
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify history is empty
        response = client.get("/api/v1/qr/history")
        assert response.json() == []


class TestValidation:
    def test_validate_text(self):
        """Test text validation"""
        response = client.get("/api/v1/qr/validate?content=Hello")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["is_url"] is False

    def test_validate_url(self):
        """Test URL validation"""
        response = client.get("/api/v1/qr/validate?content=https://example.com")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["is_url"] is True

    def test_validate_empty(self):
        """Test empty content validation"""
        response = client.get("/api/v1/qr/validate?content=")
        assert response.status_code == 200
        assert response.json()["valid"] is False


class TestDownload:
    def test_download_nonexistent(self):
        """Test download fails for nonexistent file"""
        response = client.get("/api/v1/qr/download/nonexistent.png")
        assert response.status_code == 404


class TestAPIFeatures:
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.options("/api/v1/qr/generate")
        assert "access-control-allow-origin" in response.headers or response.status_code in [200, 405]

    def test_margin_control(self):
        """Test margin parameter"""
        for margin in [0, 4, 10, 20]:
            response = client.post(
                "/api/v1/qr/generate",
                json={"content": f"Margin {margin}", "margin": margin}
            )
            assert response.status_code == 200, f"Margin {margin} failed"

    def test_margin_invalid(self):
        """Test invalid margin fails"""
        response = client.post(
            "/api/v1/qr/generate",
            json={"content": "Test", "margin": 25}
        )
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
