# Task 2A: Upload Flow - Quick Reference Guide

## Files Implemented/Modified

### Backend (3 files)

1. **Created: `zcc-api/src/routes/reports.ts`** (182 lines)
   - `POST /api/reports/initiate` - Create report + get signed upload URL
   - `POST /api/reports/:id/checkout` - Validate PDF + update status

2. **Modified: `zcc-api/src/index.ts`**
   - Line 6: Added `import reportRoutes from './routes/reports'`
   - Line 16: Added `app.use('/api/reports', reportRoutes)`

3. **Modified: `zcc-api/supabase/migrations/20260511_reports.sql`**
   - Line 8: Updated status values to include `'pending_upload'` and `'pending_payment'`

### Frontend (3 files)

4. **Modified: `zcc-web/src/pages/UploadPage.tsx`** (Complete rewrite, 292 lines)
   - Vendor name input field
   - PDF drag-and-drop zone
   - 3-step upload flow
   - Comprehensive error handling
   - Loading states
   - Authentication check

5. **Modified: `zcc-web/src/styles/pages.css`** (+170 lines of new CSS)
   - Upload page layout
   - Form components
   - Drop zone states
   - Error and info messages
   - Dark theme styling

6. **Modified: `zcc-web/.env.example`**
   - Line 6: `VITE_API_URL=http://localhost:4000` (was 3000)

---

## Key Implementation Details

### Backend Endpoints

#### POST /api/reports/initiate
```bash
curl -X POST http://localhost:4000/api/reports/initiate \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"Stripe"}'
```

**Response (201 Created):**
```json
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_url": "https://...",
  "vendor_name": "Stripe"
}
```

#### POST /api/reports/:id/checkout
```bash
curl -X POST http://localhost:4000/api/reports/550e8400-e29b-41d4-a716-446655440000/checkout \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending_payment",
  "pdf_storage_path": "uploads/user-uuid/550e8400-e29b-41d4-a716-446655440000.pdf"
}
```

### Frontend Upload Flow

```javascript
// Step 1: Initialize
const { report_id, upload_url } = await fetch('/api/reports/initiate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ vendor_name })
}).then(r => r.json());

// Step 2: Upload PDF
await fetch(upload_url, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/pdf' },
  body: pdfFile
});

// Step 3: Checkout
await fetch(`/api/reports/${report_id}/checkout`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Step 4: Redirect
navigate(`/report/${report_id}`);
```

---

## State Management (UploadPage Component)

| State | Type | Purpose |
|-------|------|---------|
| `vendorName` | string | Form input |
| `pdfFile` | File \| null | Selected PDF |
| `isDragging` | boolean | Drag state |
| `isLoading` | boolean | Upload progress |
| `error` | UploadError \| null | Error message |

---

## Styling Conventions

### Colors (Dark Theme)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark | `#0d1117` |
| Cards | Darker | `#161b22` |
| Primary Text | Light | `#c9d1d9` |
| Secondary Text | Gray | `#8b949e` |
| Borders | Dark Gray | `#30363d` |
| Accent | Blue | `#58a6ff` |
| Success | Green | `#28a745` |
| Error | Red | `#f85149` |

### Component Classes
- `.upload-page` - Main container
- `.upload-card` - Card wrapper
- `.form-group` - Input section
- `.drop-zone` - Drag area
- `.error-banner` - Error display
- `.submit-btn` - Primary button

---

## Error Handling

| Scenario | Status | Message | Handled |
|----------|--------|---------|---------|
| Missing vendor name | Form validation | "Please fill in all fields" | Frontend |
| Invalid PDF | Form validation | "Please upload a valid PDF file" | Frontend |
| File > 50MB | Form validation | "PDF must be smaller than 50MB" | Frontend |
| API fails | Backend | Server error message | Frontend toast |
| PDF not found | 400 | "PDF not found in storage" | Frontend |
| Wrong status | 400 | "Invalid report status" | Frontend |
| Not authorized | 401 | "Missing or invalid Bearer token" | Frontend |
| Report not found | 404 | "Report not found or access denied" | Frontend |

---

## Database Integration

### Reports Table Columns Used
- `id` - Auto-generated UUID
- `user_id` - From auth token
- `title` - Set to `{vendor_name} Report`
- `status` - Updated: `'pending_upload'` → `'pending_payment'`
- `amount_cents` - Default: 4900 ($49.00)
- `currency` - Default: 'usd'
- `pdf_storage_path` - Set during checkout
- `updated_at` - Timestamp

### Supabase Storage
- Bucket: `reports`
- Path format: `uploads/{user_id}/{report_id}.pdf`
- Signed URLs expire: 10 minutes

---

## Required Environment Setup

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

### Supabase Storage Setup
1. Create bucket: `reports`
2. RLS Policy (upload):
   ```sql
   Allow authenticated users to upload via signed URLs
   ```
3. CORS (if needed):
   ```
   Allow: https://localhost:3000, http://localhost:3000, http://localhost:4000
   ```

---

## Testing Checklist

### Unit Level
- [ ] Vendor name validation works
- [ ] PDF type checking works
- [ ] File size validation (50MB) works
- [ ] Drag-and-drop event handlers work
- [ ] Form button disabled/enabled correctly

### Integration Level
- [ ] POST /initiate creates report in DB
- [ ] Signed URL is valid for 10 min
- [ ] PDF uploads to storage successfully
- [ ] POST /checkout validates PDF exists
- [ ] Report status updates to pending_payment
- [ ] Redirect to /report/:id works

### E2E Level
- [ ] Can upload PDF on UploadPage
- [ ] Complete flow: initiate → upload → checkout → redirect
- [ ] Error messages display on failures
- [ ] Auth error redirects to login
- [ ] Loading states prevent double-submit

---

## Performance Considerations

- PDF upload via signed URL (direct to Supabase, not through API)
- Async operations with proper loading states
- Form validation before API calls
- Minimal re-renders with useCallback for event handlers

---

## Security Considerations

- Bearer token in Authorization header
- User ID verified from JWT
- Row-level security on database
- Signed URLs expire after 10 minutes
- PDF file type validation
- Max file size enforcement

---

## Next Steps (Task 2B)

The checkout endpoint (`POST /api/reports/:id/checkout`) is ready to be extended with:
1. Stripe price lookup
2. Stripe session creation
3. Session URL/client secret response
4. Redirect to Stripe checkout
5. Webhook handling for payment confirmation

The status `'pending_payment'` indicates the report is ready for payment processing.
