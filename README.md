# LandSurveyPro

An intelligent, full-stack Land Survey Record Management System built with Node.js, Express.js, MongoDB Atlas, EJS, and Bootstrap 5. Designed to digitize and centralize government land survey records with role-based access control, interactive map visualization, audit history tracking, PDF export, and document upload support.

---


## Overview

LandSurveyPro replaces paper-based and spreadsheet-driven land record management with a centralized, searchable web application. Officers can register plots with GPS coordinates, upload ownership documents and survey photographs, track every change through a permanent audit trail, and export any record as a formatted PDF — all from a browser.

The system enforces a three-tier role hierarchy so that read access, write access, and administrative control remain clearly separated. Every action that modifies data is permanently logged with the performing user, timestamp, changed field values, and client IP address.

---

## Features

### Authentication and Access Control
- User registration and login with bcrypt password hashing (12 salt rounds)
- Server-side session management via express-session
- Three roles: User (read only), Survey Officer (add and edit), Admin (full access)
- Role promotion managed by Admin through the user management panel
- Account activation and deactivation without deletion

### Land Record Module
- Add land records with full detail: plot number, survey number, owner information, area, land type, land use, GPS coordinates, address hierarchy (village, taluka, district, state, country, pincode), survey date, registration date, status, and remarks
- Edit existing records with field-level change tracking
- Delete records (Admin only) with automatic cleanup of uploaded files
- Search across all fields simultaneously: plot number, survey number, owner name, state, district, country, land type, status, and date range
- Pagination with configurable page size (10, 25, 50 records)
- Sortable columns by plot number, owner name, state, and survey date

### Interactive Map
- Leaflet.js map rendering on OpenStreetMap tiles
- Color-coded markers by land type (agricultural, residential, commercial, industrial, forest, waste, other)
- Disputed records highlighted with a red border ring
- MarkerCluster grouping for dense areas
- Filter markers by land type without page reload
- Click any marker to see plot summary and link to full record

### PDF Export
- Server-side PDF generation using PDFKit
- Formatted A4 document with branded header and footer
- All record fields included: ownership, land details, location, survey information, remarks
- Export logged in the record's audit trail
- Streams directly to browser download (no temp file written to disk)

### File Upload
- Upload ownership proof documents (PDF, DOC, DOCX, JPG, PNG — up to 5 files, 5MB each)
- Upload survey site photographs (JPG, PNG, GIF — up to 10 files, 5MB each)
- Files renamed to UUID on disk to prevent collisions and path traversal
- File metadata (original name, type, size, uploader, timestamp) stored in the record document

### Audit History
- Every create, update, view, delete, and export action is logged
- Logs include: action type, performing user name, user ID, timestamp, client IP
- Updates additionally store before and after values for each changed field
- Audit trail displayed on the record detail page, most recent first
- Last 15 entries shown in the UI; full history stored in the database

### Admin Panel
- System statistics: total users, total records, survey officer count
- Recently registered users table
- User management: view all users, change role, activate or deactivate, delete
- Admins cannot delete their own account

### REST API
- JSON endpoints under `/api` for integration and future frontend migration
- Paginated record listing with state and status filters
- Single record fetch by ID
- Map coordinate data endpoint
- System statistics endpoint
- All API routes require authentication

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 18+ | Server-side JavaScript |
| Framework | Express.js | 4.18 | HTTP routing and middleware |
| Database | MongoDB Atlas | Cloud | Document storage |
| ODM | Mongoose | 8.3 | Schema, validation, queries |
| View engine | EJS | 3.1 | Server-side HTML rendering |
| CSS framework | Bootstrap | 5.3 | Responsive UI layout |
| Icons | Bootstrap Icons | 1.11 | UI iconography |
| Maps | Leaflet.js | 1.9.4 | Interactive map rendering |
| Map clustering | Leaflet MarkerCluster | 1.5.3 | Grouped markers at scale |
| PDF generation | PDFKit | 0.15 | Server-side PDF creation |
| File uploads | Multer | 1.4.5 | Multipart form handling |
| Password hashing | bcryptjs | 2.4 | Secure credential storage |
| Sessions | express-session | 1.18 | Server-side auth state |
| Flash messages | connect-flash | 0.1 | One-time UI notifications |
| Security headers | Helmet | 7.1 | HTTP header hardening |
| Rate limiting | express-rate-limit | 7.2 | Brute-force protection |
| Validation | express-validator | 7.0 | Input sanitization |
| Unique IDs | uuid | 9.0 | Uploaded file naming |
| Logging | Morgan | 1.10 | HTTP request logs (dev) |
| Dev server | Nodemon | 3.1 | Auto-restart on file change |

---

## Folder Structure

```
land-survey-system/
│
├── server.js                    # Application entry point
├── createAdmin.js               # One-time script to seed first admin
├── package.json
├── .env.example                 # Environment variable template
│
├── config/                      # Reserved for future DB config extraction
│
├── controllers/
│   ├── authController.js        # Login, register, logout, profile
│   ├── recordController.js      # CRUD, search, PDF export, map data
│   └── adminController.js       # User management, admin dashboard
│
├── middleware/
│   ├── auth.js                  # isAuthenticated, isAdmin, isAdminOrOfficer
│   └── upload.js                # Multer config for file uploads
│
├── models/
│   ├── User.js                  # User schema with bcrypt hook
│   └── Survey.js                # Survey schema with embedded audit trail
│
├── routes/
│   ├── authRoutes.js            # /login /register /logout /profile
│   ├── recordRoutes.js          # /records/* (all CRUD and export)
│   ├── adminRoutes.js           # /admin/*
│   └── apiRoutes.js             # /api/* (JSON responses)
│
├── views/
│   ├── partials/
│   │   ├── header.ejs           # Shared HTML head, navbar, flash alerts
│   │   └── footer.ejs           # Shared footer, Bootstrap JS
│   ├── auth/
│   │   ├── login.ejs
│   │   ├── register.ejs
│   │   └── profile.ejs
│   ├── records/
│   │   ├── dashboard.ejs        # Stats, charts, recent records
│   │   ├── list.ejs             # Search, filter, paginated table
│   │   ├── add.ejs              # New record form
│   │   ├── edit.ejs             # Edit existing record form
│   │   ├── view.ejs             # Full record detail with map and audit trail
│   │   └── map.ejs              # Full-screen Leaflet map
│   ├── admin/
│   │   ├── dashboard.ejs        # Admin stats and recent users
│   │   └── users.ejs            # User management table with edit modal
│   ├── 404.ejs
│   └── error.ejs
│
└── public/
    ├── css/
    │   └── main.css             # Full custom theme (earthy green palette)
    ├── js/
    │   └── main.js              # Alert dismiss, file drop zones, nav highlight
    └── uploads/
        ├── proofs/              # Uploaded ownership documents
        └── images/              # Uploaded survey photographs
```

---

## MongoDB Schema Design

### User Collection

```js
{
  full_name:   String,           // required
  email:       String,           // required, unique, lowercase
  password:    String,           // bcrypt hashed, select: false
  role:        String,           // enum: user | survey_officer | admin
  phone:       String,
  department:  String,
  is_active:   Boolean,          // false blocks login
  last_login:  Date,
  created_at:  Date
}
```

The password field carries `select: false` so it is never returned by any query unless explicitly requested with `.select('+password')`. This prevents accidental exposure in API responses.

### Survey Collection

```js
{
  // Identification
  plot_number:    String,        // required, unique, auto-uppercased
  survey_number:  String,

  // Ownership
  owner_name:     String,        // required
  owner_contact:  String,
  owner_aadhaar:  String,

  // Land details
  area:           String,        // required
  area_unit:      String,        // acres | hectares | sq_meters | sq_feet | guntha
  land_type:      String,        // agricultural | residential | commercial | ...
  land_use:       String,

  // Location
  lat:            String,        // required
  lng:            String,        // required
  address:        String,
  village:        String,
  taluka:         String,
  district:       String,
  state:          String,
  country:        String,        // default: India
  pincode:        String,

  // Dates
  survey_date:        Date,      // required
  registration_date:  Date,
  last_verified_date: Date,

  // Status
  status:   String,   // active | disputed | under_review | transferred | archived
  remarks:  String,

  // Embedded sub-documents
  ownership_proofs: [DocumentSchema],
  survey_images:    [DocumentSchema],
  audit_trail:      [AuditSchema],

  // Metadata
  created_by:       ObjectId,    // ref: User
  created_by_name:  String,
  updated_by:       ObjectId,
  updated_by_name:  String,
  created_at:       Date,
  updated_at:       Date
}
```

### Embedded: DocumentSchema

```js
{
  filename:      String,   // UUID-based name on disk
  original_name: String,   // original upload filename
  mimetype:      String,
  size:          Number,   // bytes
  uploaded_at:   Date,
  uploaded_by:   ObjectId
}
```

### Embedded: AuditSchema

```js
{
  action:            String,   // created | updated | deleted | viewed | exported
  performed_by:      ObjectId,
  performed_by_name: String,
  timestamp:         Date,
  changes:           Mixed,    // { fieldName: { from: oldVal, to: newVal } }
  ip_address:        String
}
```

### Indexes

```js
{ plot_number: 1 }                              // unique lookup
{ owner_name: 'text', address: 'text', village: 'text' }  // full-text search
{ state: 1, district: 1 }                       // location filter
{ survey_date: -1 }                             // date range queries
{ status: 1 }                                   // status filter
```

---

## Role-Based Access Control

| Route | User | Survey Officer | Admin |
|---|:---:|:---:|:---:|
| GET /records/dashboard | Yes | Yes | Yes |
| GET /records | Yes | Yes | Yes |
| GET /records/map | Yes | Yes | Yes |
| GET /records/:id | Yes | Yes | Yes |
| GET /records/:id/pdf | Yes | Yes | Yes |
| GET /records/add | No | Yes | Yes |
| POST /records/add | No | Yes | Yes |
| GET /records/:id/edit | No | Yes | Yes |
| POST /records/:id/edit | No | Yes | Yes |
| POST /records/:id/delete | No | No | Yes |
| GET /admin | No | No | Yes |
| GET /admin/users | No | No | Yes |
| POST /admin/users/:id/role | No | No | Yes |
| POST /admin/users/:id/delete | No | No | Yes |

Middleware functions applied at router level:

```js
// middleware/auth.js
exports.isAuthenticated    // session must exist
exports.isAdminOrOfficer   // role must be admin or survey_officer
exports.isAdmin            // role must be admin
```

---

## REST API Reference

All endpoints require an active login session.

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/records | Paginated record list. Query: `page`, `limit`, `state`, `status` |
| GET | /api/records/:id | Single record by MongoDB ID |
| GET | /api/map-data | All records with lat/lng for map rendering |
| GET | /api/stats | System statistics by status, type, and state |

### Example: GET /api/records

```
GET /api/records?page=1&limit=20&state=Karnataka&status=active
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "plot_number": "PLT-001",
      "owner_name": "Rajesh Kumar",
      "lat": "12.9716",
      "lng": "77.5946",
      "status": "active",
      "land_type": "agricultural",
      "state": "Karnataka",
      "area": "2.5",
      "area_unit": "acres"
    }
  ],
  "total": 142,
  "page": 1,
  "pages": 8
}
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A MongoDB Atlas account (free tier is sufficient)

### Installation

```bash
# 1. Clone or extract the project folder
cd land-survey-system

# 2. Install dependencies
npm install

# 3. Copy environment variable template
cp .env.example .env

# 4. Edit .env with your MongoDB URI and secret keys
#    (see Environment Variables section below)

# 5. Create the first admin account
node createAdmin.js

# 6. Start the development server
npm run dev

# 7. Open browser
#    http://localhost:5500
```

### Production start

```bash
npm start
```

---

## Creating the First Admin

After installation, run the seed script once:

```bash
node createAdmin.js
```

This creates an admin account with the following default credentials:

```
Email:    admin@landsurvey.com
Password: Admin@1234
Role:     admin
---

## Authentication Flow

```
1. User submits POST /login with email and password

2. Express body-parser extracts req.body

3. Mongoose queries MongoDB:
   User.findOne({ email, is_active: true }).select('+password')
   - is_active: false  →  query returns null  →  login fails
   - email not found   →  null  →  login fails

4. bcrypt.compare(submittedPassword, storedHash)
   - Extracts salt from stored hash
   - Re-hashes submitted password with same salt
   - Compares result — one-way, cannot be reversed
   - No match  →  same generic error (does not reveal whether email exists)

5. On success:
   - user.last_login updated in MongoDB
   - Session created in server memory:
     req.session.user = {
       _id: user._id.toString(),   // stored as plain string
       full_name, email, role, department
     }
   - connect.sid cookie sent to browser (session ID only, no user data)

6. Subsequent requests:
   - Browser sends connect.sid cookie automatically
   - Express reads session from memory using the ID
   - isAuthenticated middleware checks req.session.user exists
   - Role middleware checks req.session.user.role as needed

7. Logout:
   - req.session.destroy() clears session from memory
   - res.clearCookie('connect.sid') removes cookie from browser
```

---

## Security Implementation

| Mechanism | Implementation | Purpose |
|---|---|---|
| Password hashing | bcryptjs, 12 salt rounds | Passwords never stored in plain text |
| HTTP security headers | Helmet.js with CSP | XSS, clickjacking, MIME sniffing protection |
| Rate limiting | express-rate-limit, 200 req/15min/IP | Brute-force and DDoS mitigation |
| Session security | HttpOnly cookie, SameSite=Lax | Cookie inaccessible to JavaScript |
| Secure cookies | Enabled in production via NODE_ENV | HTTPS-only cookie transmission |
| Input validation | express-validator on registration | Server-side input sanitization |
| ObjectId validation | mongoose.Types.ObjectId.isValid() | Prevents CastError injection |
| File type validation | Extension and mimetype whitelist in Multer | Blocks executable uploads |
| File naming | UUID v4 | Prevents path traversal and collisions |
| select: false | Password field in User schema | Never returned in API responses |
| Generic error messages | Same message for wrong email and wrong password | Prevents user enumeration |
| Role checks at router level | Middleware on router, not in controllers | Consistent protection, no gaps |

---

## Error Handling

### Application errors

Every controller method wraps its logic in a try-catch block. On failure:
- The error is logged to the server console with `console.error`
- A flash message is set for the user
- The request is redirected to a safe fallback page
- The server continues running

### Global error handler

Registered in `server.js` as the last middleware:

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).render('error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Something went wrong. Please try again.',
    status,
  });
});
```

In production, raw error messages are never sent to the browser.

### 404 handler

```js
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});
```

### Defensive error views

Both `error.ejs` and `404.ejs` guard every variable:

```ejs
<%= typeof status !== 'undefined' ? status : 500 %>
```

This prevents the error page itself from crashing if variables are missing — a self-referential failure that otherwise produces a raw Node.js stack trace in the browser.

---

## Known Limitations and Future Improvements

### Current limitations

**Local file storage** — uploaded files are saved to `public/uploads/` on the server's local filesystem. Files are lost on server redeploy and do not replicate across multiple instances. For production, replace Multer's `diskStorage` with `multer-s3` and store file URLs in MongoDB.

**In-memory sessions** — express-session defaults to an in-memory store. Sessions are lost on server restart and cannot be shared across multiple Node.js processes. Add `connect-redis` as a session store for persistence and horizontal scaling.

**Unbounded audit trail** — audit entries are embedded in the Survey document and grow indefinitely. A record with many changes over years can accumulate a very large document. Migrate the audit trail to a separate MongoDB collection with a `survey_id` reference.

**Full-page search reload** — every filter change on the records list triggers a full server round trip. Moving the search to client-side fetch against the `/api/records` endpoint would improve responsiveness.

**All map markers loaded at once** — the map endpoint returns all coordinates in a single response. At tens of thousands of records this becomes slow. Implement a bounding-box API that returns only coordinates within the current map viewport.


