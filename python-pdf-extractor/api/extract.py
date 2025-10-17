"""
PDF Text Extraction Microservice
Isolated Python service for extracting text from PDF files.
Deployed separately on Vercel - zero impact on main codebase.
"""

from http.server import BaseHTTPRequestHandler
import json
import io
import sys

# Try to import PDF libraries (installed via requirements.txt)
try:
    import PyPDF2
    PDF_LIBRARY = "PyPDF2"
except ImportError:
    try:
        import pdfplumber
        PDF_LIBRARY = "pdfplumber"
    except ImportError:
        PDF_LIBRARY = None


class handler(BaseHTTPRequestHandler):
    """
    Vercel Serverless Function Handler
    Endpoint: POST /api/extract
    Input: PDF file bytes in request body
    Output: JSON with extracted text
    """

    def do_GET(self):
        """Health check endpoint - confirms service is running"""
        self._send_success({
            "status": "ready",
            "message": "PDF Extractor Service is running. Use POST to extract text from PDFs.",
            "library_available": PDF_LIBRARY or "No PDF library installed",
            "endpoint": "/api/extract",
            "method": "POST",
            "content_type": "application/pdf"
        })

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Extract text from uploaded PDF"""
        try:
            # Read PDF bytes from request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_error(400, "No PDF data received")
                return

            pdf_bytes = self.rfile.read(content_length)

            # Check if PDF libraries are available
            if PDF_LIBRARY is None:
                self._send_error(500, "PDF extraction libraries not installed")
                return

            # Extract text using available library
            if PDF_LIBRARY == "PyPDF2":
                extracted_text = self._extract_with_pypdf2(pdf_bytes)
            elif PDF_LIBRARY == "pdfplumber":
                extracted_text = self._extract_with_pdfplumber(pdf_bytes)
            else:
                self._send_error(500, "No PDF library available")
                return

            # Return extracted text
            self._send_success({
                "success": True,
                "text": extracted_text,
                "text_length": len(extracted_text),
                "library_used": PDF_LIBRARY
            })

        except Exception as e:
            self._send_error(500, f"Extraction failed: {str(e)}")

    def _extract_with_pypdf2(self, pdf_bytes):
        """Extract text using PyPDF2"""
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))

        text_parts = []
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}\n")
            except Exception as e:
                text_parts.append(f"--- Page {page_num + 1} (Error: {str(e)}) ---\n")

        return "\n".join(text_parts)

    def _extract_with_pdfplumber(self, pdf_bytes):
        """Extract text using pdfplumber (better for complex PDFs)"""
        import pdfplumber

        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}\n")
                except Exception as e:
                    text_parts.append(f"--- Page {page_num + 1} (Error: {str(e)}) ---\n")

        return "\n".join(text_parts)

    def _send_success(self, data):
        """Send successful JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, code, message):
        """Send error JSON response"""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": False,
            "error": message
        }).encode())
