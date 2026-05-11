# Task 2A: Upload Flow - Implementation Summary

## Date Completed
May 11, 2026

## Overview
Implemented the complete upload flow for the ZCC pay-per-report feature, including:
- Backend API endpoints for report initiation and checkout
- Frontend upload interface with PDF drag-and-drop
- Integration with Supabase Storage for PDF uploads
- End-to-end error handling and user feedback

---

## Backend Implementation

### 1. **File Created: `zcc-api/src/routes/reports.ts`**

**Purpose:** Handles all report-related API endpoints

**Key Endpoints:**

#### `POST /api/reports/initiate`
- **Authentication:** Required (Bearer token)
- **Input:** `{ vendor_name: string }`
- **Process:**
  1. Validates vendor_name input
  2. Creates report row in `reports` table with:
     - `status: 'pending_upload'`
     - `user_id` from authenticated user
     - Default price: $49.00 (4900 cents)
  3. Generates signed upload URL for Supabase Storage
     - Path: `/uploads/{user_id}/{report_id}.pdf`
     - Expiry: 10 minutes
- **Response:** 
  ```json
  {
    "report_id": "uuid",
    "upload_url": "signed-url-for-pdf-upload",
    "vendor_name": "string"
  }
  ```

#### `POST /api/reports/:id/checkout`
- **Authentication:** Required (Bearer token)
- **Authorization:** User must own the report
- **Input:** (none - all info from route params and auth)
- **Process:**
  1. Fetches report and verifies ownership
  2. Validates status is `'pending_upload'`
  3. Checks PDF exists in Supabase Storage
  4. Updates report:
     - Sets `pdf_storage_path` to the upload path
     - Updates `status` to `'pending_payment'`
     - Updates `updated_at` timestamp
- **Response:**
  ```json
  {
    "report_id": "uuid",
    "status": "pending_payment",
    "pdf_storage_path": "uploads/{user_id}/{report_id}.pdf"
  }
  ```

**Error Handling:**
- 400: Missing/invalid input, wrong status, PDF not found
- 401: User not authenticated
- 404: Report not found or access denied
- 500: Database/storage errors

### 2. **File Modified: `zcc-api/src/index.ts`**

**Changes:**
- Added import for `reportRoutes`
- Registered route at `/api/reports`

```typescript
import reportRoutes from './routes/reports';
// ...
app.use('/api/reports', reportRoutes);
```

### 3. **File Modified: `zcc-api/supabase/migrations/20260511_reports.sql`**

**Changes:**
- Updated status comment to include new statuses:
  - `'pending_upload'` - Report created, awaiting PDF upload
  - `'pending_payment'` - PDF uploaded, awaiting payment processing
  - (Original statuses: `'draft'`, `'processing'`, `'completed'`, `'failed'`)

**Note:** Requires Supabase Storage bucket `reports` to be created with:
- Public read policy for authenticated users
- Write access for authenticated users (via signed URLs)

---

## Frontend Implementation

### 4. **File Modified: `zcc-web/src/pages/UploadPage.tsx`**

**Purpose:** PDF upload interface with form validation and multi-step flow

**Features:**

#### UI Components:
1. **Vendor Name Input**
   - Text input field
   - Required for form submission
   - Placeholder: "e.g., Stripe, AWS, Microsoft"

2. **PDF Drag-and-Drop Zone**
   - Accepts `.pdf` files only
   - Max size: 50MB
   - Visual feedback:
     - Hover state (blue border)
     - Drag-over state (blue background)
     - File selected state (green border)
   - Browse button fallback
   - Displays selected file info (name, size)

3. **Continue to Payment Button**
   - Disabled until both fields are filled
   - Shows "Processing..." during upload
   - Handles the complete flow

4. **Error Banner**
   - Displays upload errors with title and message
   - Styled for visibility

#### Upload Flow (Multi-Step):

```
Step 1: POST /api/reports/initiate
├─ Send vendor_name
├─ Receive: report_id + signed_upload_url
└─ Display: "Uploading..."

Step 2: Upload PDF to Signed URL
├─ PUT request with PDF file
├─ Content-Type: application/pdf
└─ Handle upload success/failure

Step 3: POST /api/reports/:id/checkout
├─ Validate PDF & update status
├─ Verify user authorization
└─ Return updated report status

Step 4: Redirect
└─ Navigate to /report/{report_id}
```

**Validation:**
- PDF type checking (application/pdf)
- File size validation (max 50MB)
- Vendor name not empty
- Authentication check
- All API responses validated

**Error Handling:**
- Validation errors with user-friendly messages
- Network errors with retry guidance
- Auth errors redirect to login
- Loading states prevent double-submission

**State Management:**
- `vendorName` - Form input
- `pdfFile` - Selected PDF
- `isDragging` - Drag zone state
- `isLoading` - Upload progress
- `error` - Error message object

### 5. **File Modified: `zcc-web/src/styles/pages.css`**

**New Styles Added:**

- `.upload-page` - Main container with centered layout
- `.upload-card` - Card container (dark theme)
- `.upload-form` - Form layout with gap
- `.form-group` - Input group spacing
- `.form-label` - Label styling
- `.form-input` - Text input with focus states
- `.drop-zone` - Drag-and-drop area
  - States: normal, hovering, dragging, has-file
- `.drop-zone-content` - Empty state content
- `.file-selected` - File uploaded state
- `.error-banner` - Error message container
- `.submit-btn` - "Continue to Payment" button
- `.upload-info` - Security info footer
- `.auth-required` - Authentication required message

**Design System Compliance:**
- Dark theme: `#0d1117` (background)
- Accent color: `#58a6ff` (interactive elements)
- Secondary text: `#8b949e`
- Error color: `#f85149`
- Success color: `#28a745`
- Borders: `#30363d`

---

## Environment Configuration

### 6. **File Modified: `zcc-web/.env.example`**

**Changes:**
- Updated `VITE_API_URL` from `http://localhost:3000` to `http://localhost:4000`

```env
VITE_API_URL=http://localhost:4000
```

---

## Database Schema Updates

**Reports Table Status Values:**
- `'pending_upload'` - Initial state after report creation
- `'pending_payment'` - After PDF upload and validation

**Storage Path:**
- `pdf_storage_path` - Updated by checkout endpoint
- Format: `uploads/{user_id}/{report_id}.pdf`

---

## API Integration Points

### Authentication
- Uses Bearer token authentication
- Validates via Supabase Auth
- User ID extracted from JWT claims

### Supabase Storage
- Bucket name: `reports`
- Path pattern: `uploads/{user_id}/{report_id}.pdf`
- Signed URLs valid for 10 minutes

### Frontend to Backend
- Base URL: `import.meta.env.VITE_API_URL`
- Default: `http://localhost:4000`
- All requests include `Authorization: Bearer {access_token}`

---

## Testing Checklist

- [ ] Vendor name is required
- [ ] PDF file is required
- [ ] Only PDF files accepted (type validation)
- [ ] File size max 50MB enforced
- [ ] Drag-and-drop works
- [ ] Browse file picker works
- [ ] Form button disabled until both fields filled
- [ ] API initiate endpoint returns report_id and upload_url
- [ ] PDF uploads to signed URL successfully
- [ ] Checkout validates PDF exists in storage
- [ ] Report status updates to 'pending_payment'
- [ ] Redirect to /report/:id after successful upload
- [ ] Error messages display for API failures
- [ ] Loading states show during processing
- [ ] Authentication errors handled gracefully
- [ ] User can't access upload page when not authenticated

---

## Files Created/Modified Summary

| File | Action | Purpose |
|------|--------|---------|
| `zcc-api/src/routes/reports.ts` | Created | Report API endpoints |
| `zcc-api/src/index.ts` | Modified | Register reports route |
| `zcc-api/supabase/migrations/20260511_reports.sql` | Modified | Document new statuses |
| `zcc-web/src/pages/UploadPage.tsx` | Modified | Upload UI and flow |
| `zcc-web/src/styles/pages.css` | Modified | Upload page styling |
| `zcc-web/.env.example` | Modified | API URL configuration |

---

## Notes for Next Steps (Task 2B)

The checkout endpoint currently:
1. ✅ Validates PDF exists
2. ✅ Updates status to `'pending_payment'`
3. ⏳ **Ready for Task 2B:** Create Stripe payment session
   - Extend `/api/reports/:id/checkout`
   - Create Stripe session
   - Return session ID + client secret
   - Redirect to Stripe checkout

---

## Deployment Notes

### Required Supabase Setup
1. Create storage bucket: `reports`
2. Set RLS policies to allow authenticated file uploads via signed URLs
3. Configure CORS if frontend is on different domain

### Required Environment Variables

**Backend (.env):**
```
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_API_URL=http://your-api-url:4000
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         ZCC Upload Flow (Task 2A)               │
└─────────────────────────────────────────────────┘

Frontend (UploadPage.tsx)
    ↓
    ├─→ POST /api/reports/initiate
    │       ↓
    │   Create report row (pending_upload)
    │   Generate signed URL
    │       ↓
    │   Return: report_id + upload_url
    │
    ├─→ PUT signed_url (upload PDF to Supabase Storage)
    │       ↓
    │   File stored at: uploads/{user_id}/{report_id}.pdf
    │
    ├─→ POST /api/reports/:id/checkout
    │       ↓
    │   Verify PDF exists in storage
    │   Update report status → pending_payment
    │   Update pdf_storage_path
    │       ↓
    │   Return: report_id + status
    │
    └─→ Navigate to /report/:id
        ↓
    [Report Details Page - Task not yet implemented]
    ↓
    [Continue to Payment - Task 2B: Stripe Integration]
```
