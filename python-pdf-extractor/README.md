# Python PDF Extraction Microservice

**Purpose**: Isolated Python service for extracting text from PDF files for pitch deck analysis.

**Architecture**: Completely separate from main KStoryBridge codebase - zero impact on main application.

## Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd python-pdf-extractor
   vercel deploy --prod
   ```

3. **Get Deployment URL**:
   - Vercel will output: `https://python-pdf-extractor-xyz.vercel.app`
   - Note this URL for Supabase secrets configuration

4. **Test Endpoint**:
   ```bash
   curl -X POST https://your-deployment-url.vercel.app/api/extract \
     -H "Content-Type: application/pdf" \
     --data-binary "@test.pdf"
   ```

### Option 2: AWS Lambda (Alternative)

See `AWS_LAMBDA_DEPLOYMENT.md` for instructions (not yet implemented).

## API Specification

### Endpoint: `POST /api/extract`

**Request**:
- Method: `POST`
- Content-Type: `application/pdf` or `multipart/form-data`
- Body: PDF file bytes

**Response** (Success):
```json
{
  "success": true,
  "text": "Extracted text from all pages...",
  "text_length": 15234,
  "library_used": "PyPDF2"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Error message"
}
```

## Libraries Used

- **PyPDF2**: Primary extraction library (lightweight, fast)
- **pdfplumber**: Fallback for complex PDFs with tables/images
- **Pillow**: Image processing for pdfplumber

## Integration with Main App

This service is called ONLY by the `extract-pitch-test` Supabase Edge Function:

```typescript
// In apps/dashboard/supabase/functions/extract-pitch-test/index.ts
const extractorUrl = Deno.env.get('PDF_EXTRACTOR_URL')!;
const response = await fetch(extractorUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/pdf' },
  body: pdfBlob
});
const { text } = await response.json();
```

## Configuration

Add to Supabase Edge Function secrets:

```bash
npx supabase secrets set PDF_EXTRACTOR_URL=https://your-deployment-url.vercel.app/api/extract
```

## Testing Locally

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Vercel dev server**:
   ```bash
   vercel dev
   ```

3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3000/api/extract \
     --data-binary "@sample.pdf"
   ```

## Cost Estimate

**Vercel Serverless Functions**:
- Free tier: 100GB-hours per month
- Paid: $0.18 per GB-hour beyond free tier
- Estimated cost for ~50 PDFs/month: **FREE** (well within limits)

**AWS Lambda Alternative**:
- Free tier: 1M requests per month
- Paid: $0.20 per 1M requests
- Estimated cost for ~50 PDFs/month: **FREE** (well within limits)

## Graceful Degradation

If this service fails or is unavailable:
- Edge Function catches error
- Returns placeholder extraction (original behavior)
- Main app continues to work normally
- **Zero impact on user experience**

## Rollback Plan

To remove this service:
1. Delete Vercel deployment: `vercel remove python-pdf-extractor`
2. Revert Edge Function changes (lines 106-130 in `extract-pitch-test/index.ts`)
3. Remove `PDF_EXTRACTOR_URL` secret from Supabase
4. Delete this directory

## Maintenance

- **No ongoing maintenance required** (stateless service)
- **No database dependencies** (pure function: PDF in → text out)
- **No authentication needed** (called only by internal Edge Function)
- **Auto-scales** on Vercel (handles traffic spikes automatically)

## Support

For issues with this microservice:
1. Check Vercel deployment logs: `vercel logs`
2. Test endpoint directly with curl
3. Review Edge Function logs in Supabase dashboard
4. Fallback to placeholder extraction if needed
