# LearnSphere LMS — API Reference

Complete reference for all REST API endpoints in the LearnSphere LMS platform. All endpoints are served under `/api/` and follow Next.js App Router conventions.

---

## Table of Contents

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
- [Current User Endpoints](#current-user-endpoints)
- [Course Catalog (Public)](#course-catalog-public)
- [Course Detail & Sub-Resources](#course-detail--sub-resources)
- [Discussions](#discussions)
- [Invitations](#invitations)
- [Leaderboard](#leaderboard)
- [Payments](#payments)
- [Certificates](#certificates)
- [Public Endpoints](#public-endpoints)
- [File Upload](#file-upload)
- [Admin Endpoints](#admin-endpoints)
  - [Admin Dashboard](#admin-dashboard)
  - [Admin Reporting](#admin-reporting)
  - [Admin Users](#admin-users)
  - [Admin Courses](#admin-courses)
  - [Admin Tags](#admin-tags)
  - [Admin Badge Levels](#admin-badge-levels)
  - [Admin Payments](#admin-payments)
  - [Admin Site Settings](#admin-site-settings)
- [Error Responses](#error-responses)

---

## Conventions

| Convention         | Detail                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| **Base URL**       | `/api`                                                                 |
| **Content Type**   | `application/json` (except file uploads which use `multipart/form-data`) |
| **Auth Mechanism** | Cookie-based sessions (`session_token` httpOnly cookie)                |
| **ID Formats**     | Users & Courses use `integer` (auto-increment). Most other entities use `uuid`. |
| **Timestamps**     | ISO 8601 format                                                        |
| **Pagination**     | Query params: `page` (1-based), `limit` (default varies)              |
| **Error Format**   | `{ "error": "Human-readable message" }` with appropriate HTTP status  |

### Auth Levels

| Level       | Description                                           |
| ----------- | ----------------------------------------------------- |
| **Public**  | No authentication required                            |
| **Auth**    | Any authenticated user (valid session cookie)         |
| **Admin**   | Requires `instructor` or `superadmin` role            |
| **Superadmin** | Requires `superadmin` role only                    |

---

## Authentication

All authenticated endpoints require a valid `session_token` cookie. This cookie is set automatically upon login or signup. The middleware at `middleware.ts` redirects unauthenticated users on page routes; API routes return `401` directly.

---

## Auth Endpoints

### `POST /api/auth/send-otp`

Send a 6-digit OTP code to an email address for signup or password reset.

**Auth:** Public

**Request Body:**

| Field      | Type   | Required | Description                                      |
| ---------- | ------ | -------- | ------------------------------------------------ |
| `email`    | string | ✅       | Email address to send OTP to                     |
| `type`     | string | ✅       | `"signup"` or `"password_reset"`                 |
| `name`     | string | signup only | User's display name (required for signup)     |
| `password` | string | signup only | User's password (required for signup, validated for strength) |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "message": "OTP sent successfully. Please check your email." }` |
| `400`  | Missing fields or invalid OTP type                               |
| `409`  | Email already registered (signup only)                           |
| `429`  | Rate limited — must wait 60 seconds between OTP requests         |

**Notes:**
- For `password_reset`, returns success even if the email doesn't exist (prevents email enumeration).
- OTP codes expire after 10 minutes.

---

### `POST /api/auth/verify-otp`

Verify an OTP code. Must be called before signup or password reset can proceed.

**Auth:** Public

**Request Body:**

| Field  | Type   | Required | Description                          |
| ------ | ------ | -------- | ------------------------------------ |
| `email`| string | ✅       | Email the OTP was sent to            |
| `code` | string | ✅       | 6-digit OTP code                     |
| `type` | string | ✅       | `"signup"` or `"password_reset"`     |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "message": "OTP verified successfully", "verified": true }`  |
| `400`  | Invalid code (includes remaining attempts count)                 |
| `404`  | No OTP found for this email/type                                 |
| `410`  | OTP has expired                                                  |
| `429`  | Too many failed attempts (max 5)                                 |

---

### `POST /api/auth/signup`

Create a new learner account. Requires a previously verified signup OTP.

**Auth:** Public

**Request Body:**

| Field      | Type   | Required | Description                          |
| ---------- | ------ | -------- | ------------------------------------ |
| `name`     | string | ✅       | User's display name                  |
| `email`    | string | ✅       | Email address                        |
| `password` | string | ✅       | Password (must pass strength rules)  |
| `otp`      | string | ✅       | The verified OTP code                |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `201`  | `{ "user": { "id", "name", "email", "role" } }` — session cookie set |
| `400`  | Invalid/unverified OTP or weak password                          |
| `409`  | Email already registered                                         |

**Notes:** The user is automatically logged in (session cookie set) upon successful signup.

---

### `POST /api/auth/login`

Authenticate with email and password.

**Auth:** Public

**Request Body:**

| Field      | Type   | Required | Description    |
| ---------- | ------ | -------- | -------------- |
| `email`    | string | ✅       | Email address  |
| `password` | string | ✅       | Password       |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "user": { "id", "name", "email", "role" } }` — session cookie set |
| `401`  | Invalid email or password                                        |
| `403`  | Account deactivated                                              |

---

### `POST /api/auth/logout`

Destroy the current session.

**Auth:** Auth

**Request Body:** None

**Response:** `200` — `{ "success": true }`

---

### `GET /api/auth/me`

Get the currently authenticated user's basic info from the session.

**Auth:** Auth

**Response:**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner"
  }
}
```

---

### `POST /api/auth/forgot-password`

Initiate a password reset by sending an OTP to the user's email.

**Auth:** Public

**Request Body:**

| Field   | Type   | Required | Description   |
| ------- | ------ | -------- | ------------- |
| `email` | string | ✅       | Email address |

**Responses:**

| Status | Description                                                               |
| ------ | ------------------------------------------------------------------------- |
| `200`  | `{ "message": "If an account with that email exists, an OTP has been sent." }` |
| `429`  | Rate limited — wait 60 seconds                                            |

**Notes:** Always returns success to prevent email enumeration.

---

### `POST /api/auth/reset-password`

Reset a user's password using a previously verified OTP.

**Auth:** Public

**Request Body:**

| Field         | Type   | Required | Description             |
| ------------- | ------ | -------- | ----------------------- |
| `email`       | string | ✅       | Email address           |
| `otp`         | string | ✅       | The verified OTP code   |
| `newPassword` | string | ✅       | New password            |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "message": "Password reset successfully..." }`               |
| `400`  | Invalid/unverified/expired OTP, or weak password                 |
| `404`  | No account found with this email                                 |

---

## Current User Endpoints

### `GET /api/me/profile`

Get the current user's full profile.

**Auth:** Auth

**Response:**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "learner",
    "avatarUrl": "https://...",
    "totalPoints": 150,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  }
}
```

---

### `PATCH /api/me/profile`

Update the current user's profile.

**Auth:** Auth

**Request Body:**

| Field      | Type          | Required | Description                          |
| ---------- | ------------- | -------- | ------------------------------------ |
| `name`     | string        | ❌       | Display name (2–255 chars)           |
| `avatarUrl`| string / null | ❌       | Avatar URL (max 500 chars, valid URL)|

**Response:** `200` — `{ "user": { ... updated user ... } }`

---

### `POST /api/me/password`

Change the current user's password.

**Auth:** Auth

**Request Body:**

| Field             | Type   | Required | Description                      |
| ----------------- | ------ | -------- | -------------------------------- |
| `currentPassword` | string | ✅       | Current password                 |
| `newPassword`     | string | ✅       | New password (min 6 chars)       |

**Responses:**

| Status | Description                                                  |
| ------ | ------------------------------------------------------------ |
| `200`  | `{ "message": "Password updated successfully" }`            |
| `400`  | New password same as current or too weak                     |
| `403`  | Current password is incorrect                                |

---

### `GET /api/me/enrollments`

Get all courses the current user is enrolled in.

**Auth:** Auth

**Response:**

```json
{
  "enrollments": [
    {
      "enrollment": {
        "id": "uuid",
        "status": "in_progress",
        "enrolledAt": "...",
        "startedAt": "...",
        "completedAt": null,
        "timeSpentSeconds": 3600
      },
      "course": {
        "id": 1,
        "title": "Intro to Python",
        "description": "...",
        "imageUrl": "...",
        "accessRule": "open",
        "price": null
      }
    }
  ]
}
```

---

### `GET /api/me/points`

Get the current user's points, badges, and quiz stats.

**Auth:** Auth

**Response:**

```json
{
  "points": {
    "total": 150,
    "fromQuizzes": 120
  },
  "stats": {
    "totalQuizAttempts": 10,
    "perfectScores": 3
  },
  "currentBadge": {
    "id": "uuid",
    "name": "Silver",
    "minPoints": 100
  },
  "progressToNextBadge": {
    "badge": { "id": "uuid", "name": "Gold", "minPoints": 500 },
    "pointsNeeded": 350,
    "progressPercent": 12
  },
  "allBadges": [
    { "id": "uuid", "name": "Bronze", "minPoints": 0, "achieved": true },
    { "id": "uuid", "name": "Silver", "minPoints": 100, "achieved": true },
    { "id": "uuid", "name": "Gold", "minPoints": 500, "achieved": false }
  ]
}
```

---

## Course Catalog (Public)

### `GET /api/courses`

Browse the published course catalog with filtering, searching, and sorting.

**Auth:** Public (visibility filtering applies for anonymous users)

**Query Parameters:**

| Param    | Type   | Default   | Description                                              |
| -------- | ------ | --------- | -------------------------------------------------------- |
| `search` | string | `""`      | Search title, description, and tag names                 |
| `tag`    | string | `""`      | Filter by tag ID                                         |
| `tags`   | string | `""`      | Filter by comma-separated tag names                      |
| `sort`   | string | `"newest"`| Sort: `newest`, `oldest`, `popular`, `title`, `rating`   |
| `page`   | number | `1`       | Page number (1-based)                                    |
| `limit`  | number | `50`      | Items per page (max 50)                                  |

**Response:**

```json
{
  "courses": [
    {
      "id": 1,
      "title": "Intro to Python",
      "description": "...",
      "imageUrl": "...",
      "visibility": "everyone",
      "accessRule": "open",
      "price": null,
      "viewsCount": 42,
      "createdAt": "...",
      "tags": [{ "id": "uuid", "name": "Python" }],
      "averageRating": 4.5,
      "totalReviews": 12
    }
  ],
  "tags": [
    { "id": "uuid", "name": "Python" },
    { "id": "uuid", "name": "JavaScript" }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

**Notes:**
- Anonymous users only see courses with `visibility: "everyone"`.
- The `tags` array at the root level contains all available tags for filter UI.

---

## Course Detail & Sub-Resources

### `GET /api/courses/[id]`

Get full details for a single published course, including lessons, enrollment status, and progress.

**Auth:** Public (may require auth for `signed_in` visibility courses)

**Response:**

```json
{
  "course": {
    "id": 1,
    "title": "Intro to Python",
    "description": "...",
    "imageUrl": "...",
    "visibility": "everyone",
    "accessRule": "open",
    "price": null,
    "published": true,
    "viewsCount": 42,
    "createdAt": "...",
    "averageRating": 4.5,
    "totalReviews": 12
  },
  "lessons": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "type": "video",
      "description": "...",
      "sortOrder": 0
    }
  ],
  "enrollment": {
    "id": "uuid",
    "status": "in_progress",
    "enrolledAt": "...",
    "startedAt": "...",
    "completedAt": null
  },
  "progress": {
    "completedLessons": 3,
    "totalLessons": 10,
    "percentComplete": 30,
    "lessonStatuses": {
      "lesson-uuid-1": "completed",
      "lesson-uuid-2": "in_progress",
      "lesson-uuid-3": "not_started"
    }
  }
}
```

**Notes:** `enrollment` and `progress` are `null` if the user is not logged in or not enrolled.

---

### `POST /api/courses/[id]/enroll`

Enroll the current user in a course.

**Auth:** Auth

**Request Body:** None

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `201`  | `{ "enrollment": { ... } }` — Successfully enrolled             |
| `402`  | Payment required (for paid courses, use the payment flow instead)|
| `403`  | Invitation required (for invitation-only courses)                |
| `404`  | Course not found or not published                                |
| `409`  | Already enrolled                                                 |

**Notes:** For `invitation` access rule courses, the user must have a pending invitation. For `payment` courses, use the `/api/payments/create-order` flow instead.

---

### `POST /api/courses/[id]/view`

Increment the view count for a course.

**Auth:** Public

**Request Body:** None

**Response:** `200` — `{ "viewsCount": 43 }`

---

### `GET /api/courses/[id]/lessons/[lessonId]`

Get full lesson content (including file URLs and attachments).

**Auth:** Auth (must be enrolled)

---

### `POST /api/courses/[id]/lessons/[lessonId]/progress`

Update lesson progress for the current user.

**Auth:** Auth (must be enrolled)

---

### `GET /api/courses/[id]/quizzes/[quizId]`

Get quiz details including questions and options.

**Auth:** Auth (must be enrolled)

---

### `POST /api/courses/[id]/quizzes/[quizId]/attempt`

Submit a quiz attempt with answers.

**Auth:** Auth (must be enrolled)

---

### `GET /api/courses/[id]/quizzes/[quizId]/attempts`

Get the current user's past attempts for a specific quiz.

**Auth:** Auth

---

### `GET /api/courses/[id]/reviews`

Get reviews for a course with aggregate stats.

**Auth:** Public

**Query Parameters:**

| Param   | Type   | Default | Description              |
| ------- | ------ | ------- | ------------------------ |
| `page`  | number | `1`     | Page number              |
| `limit` | number | `10`    | Reviews per page (max 50)|

**Response:**

```json
{
  "reviews": [
    {
      "id": "uuid",
      "userId": 1,
      "rating": 5,
      "reviewText": "Excellent course!",
      "createdAt": "...",
      "userName": "Jane Smith",
      "userAvatarUrl": "..."
    }
  ],
  "stats": {
    "averageRating": 4.5,
    "totalReviews": 12,
    "distribution": { "1": 0, "2": 1, "3": 2, "4": 3, "5": 6 }
  },
  "userReview": null,
  "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 }
}
```

---

### `POST /api/courses/[id]/reviews`

Create or update a review for a course.

**Auth:** Auth (must be enrolled)

**Request Body:**

| Field        | Type          | Required | Description              |
| ------------ | ------------- | -------- | ------------------------ |
| `rating`     | integer       | ✅       | 1–5 star rating          |
| `reviewText` | string / null | ❌       | Review text (max 2000 chars) |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "review": { ... }, "updated": true/false }`                  |
| `400`  | Invalid rating                                                   |
| `403`  | Not enrolled                                                     |

---

### `DELETE /api/courses/[id]/reviews`

Delete the current user's review for a course.

**Auth:** Auth

**Response:** `200` — `{ "success": true }`

---

### `GET /api/courses/[id]/certificate`

Get the current user's certificate for a completed course.

**Auth:** Auth

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `200`  | `{ "certificate": { "certificateNumber", "issuedAt", "courseTitle", "userName", ... } }` |
| `404`  | No certificate found (course not completed)                      |

---

### `POST /api/courses/[id]/certificate`

Generate a certificate for a completed course (idempotent — returns existing if already issued).

**Auth:** Auth (must have completed the course)

**Request Body:** None

**Response:**

```json
{
  "certificate": {
    "id": "uuid",
    "certificateNumber": "CERT-M1A2B3-X4Y5Z6",
    "issuedAt": "...",
    "courseTitle": "Intro to Python",
    "courseDescription": "...",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "completedAt": "...",
    "totalLessons": 10
  },
  "created": true
}
```

---

## Discussions

### `GET /api/discussions`

List all discussion threads.

**Auth:** Auth

**Query Parameters:**

| Param             | Type   | Default  | Description                          |
| ----------------- | ------ | -------- | ------------------------------------ |
| `includeArchived` | string | `"false"`| Set to `"true"` to include archived threads |

**Response:**

```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Welcome Thread",
      "body": "Hello everyone...",
      "isPinned": true,
      "isArchived": false,
      "createdAt": "...",
      "updatedAt": "...",
      "authorId": 1,
      "authorName": "Admin",
      "authorEmail": "admin@example.com",
      "authorRole": "superadmin",
      "authorAvatarUrl": null,
      "replyCount": 5,
      "lastReplyAt": "..."
    }
  ]
}
```

**Notes:** Threads are sorted by pinned status (pinned first), then by creation date (newest first).

---

### `POST /api/discussions`

Create a new discussion thread.

**Auth:** Auth

**Request Body:**

| Field   | Type   | Required | Description                    |
| ------- | ------ | -------- | ------------------------------ |
| `title` | string | ✅       | Thread title (max 255 chars)   |
| `body`  | string | ✅       | Thread body text               |

**Response:** `201` — `{ "thread": { ... } }`

---

### `GET /api/discussions/[threadId]`

Get a single discussion thread with full details.

**Auth:** Auth

---

### `PATCH /api/discussions/[threadId]`

Update a thread (pin, archive, edit). Admins can pin/archive; authors can edit their own.

**Auth:** Auth

---

### `GET /api/discussions/[threadId]/replies`

Get all replies for a discussion thread.

**Auth:** Auth

---

### `POST /api/discussions/[threadId]/replies`

Post a reply to a discussion thread.

**Auth:** Auth

**Request Body:**

| Field  | Type   | Required | Description   |
| ------ | ------ | -------- | ------------- |
| `body` | string | ✅       | Reply content |

---

### `PATCH /api/discussions/[threadId]/replies/[replyId]`

Edit a reply (author only).

**Auth:** Auth (author only)

---

### `DELETE /api/discussions/[threadId]/replies/[replyId]`

Delete a reply (author or admin).

**Auth:** Auth (author or admin)

---

## Invitations

### `GET /api/invitations`

List all pending course invitations for the current user.

**Auth:** Auth

**Response:**

```json
{
  "invitations": [
    {
      "id": "uuid",
      "status": "pending",
      "createdAt": "...",
      "courseId": 1,
      "courseTitle": "Advanced Python",
      "courseDescription": "...",
      "courseImageUrl": "...",
      "courseAccessRule": "invitation",
      "invitedByName": "Instructor Name",
      "invitedByEmail": "instructor@example.com"
    }
  ]
}
```

---

### `POST /api/invitations/[id]/accept`

Accept a course invitation and auto-enroll.

**Auth:** Auth

**Request Body:** None

**Response:** `201` — Enrollment created

---

### `DELETE /api/invitations/[id]`

Decline/dismiss a course invitation.

**Auth:** Auth

**Response:** `200` — `{ "message": "Invitation declined successfully" }`

---

## Leaderboard

### `GET /api/leaderboard`

Get the global points leaderboard.

**Auth:** Auth

**Query Parameters:**

| Param   | Type   | Default | Description                  |
| ------- | ------ | ------- | ---------------------------- |
| `limit` | number | `25`    | Max users to return (max 100)|

**Response:**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "id": 5,
      "name": "Top Learner",
      "avatarUrl": null,
      "totalPoints": 500,
      "role": "learner",
      "badge": { "name": "Gold", "minPoints": 500 }
    }
  ],
  "currentUser": {
    "rank": 15,
    "id": 1,
    "name": "John Doe",
    "totalPoints": 150,
    "badge": { "name": "Silver", "minPoints": 100 }
  }
}
```

**Notes:** If the current user is not in the top list, their rank is calculated separately and returned in `currentUser`.

---

## Payments

### `POST /api/payments/create-order`

Create a payment order for a paid course (Razorpay or test mode).

**Auth:** Auth

**Request Body:**

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `courseId`  | number | ✅       | Course ID   |

**Response (Live Mode):**

```json
{
  "testMode": false,
  "orderId": "order_XXXXXXXXX",
  "amount": 49900,
  "currency": "INR",
  "paymentId": "uuid",
  "keyId": "rzp_live_xxx",
  "courseName": "Advanced Python",
  "courseId": 1,
  "prefill": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response (Test Mode):**

```json
{
  "testMode": true,
  "orderId": "test_order_xxx",
  "amount": 49900,
  "currency": "INR",
  "paymentId": "uuid",
  "courseName": "Advanced Python",
  "courseId": 1,
  "prefill": { "name": "John Doe", "email": "john@example.com" }
}
```

**Notes:**
- `amount` is in the smallest currency unit (paise for INR, cents for USD).
- Test mode activates automatically when `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not configured.

---

### `POST /api/payments/verify`

Verify a payment and create the enrollment.

**Auth:** Auth

**Request Body (Live Mode):**

| Field                  | Type   | Required | Description                      |
| ---------------------- | ------ | -------- | -------------------------------- |
| `razorpay_order_id`    | string | ✅       | Razorpay order ID                |
| `razorpay_payment_id`  | string | ✅       | Razorpay payment ID              |
| `razorpay_signature`   | string | ✅       | Razorpay HMAC signature          |
| `paymentId`            | string | ✅       | Internal payment record ID       |

**Request Body (Test Mode):**

| Field       | Type    | Required | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `paymentId` | string  | ✅       | Internal payment record ID |
| `testMode`  | boolean | ✅       | Must be `true`             |

**Responses:**

| Status | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| `201`  | `{ "message": "Payment verified successfully!", "enrollment": { ... } }` |
| `200`  | Payment already verified (returns existing enrollment)           |
| `400`  | Invalid signature (live mode) — payment marked as failed         |
| `404`  | Payment record not found                                         |

---

## Certificates

### `GET /api/certificates/[certificateNumber]`

Publicly verify a certificate by its unique certificate number.

**Auth:** Public

**Response:**

```json
{
  "certificate": {
    "id": "uuid",
    "certificateNumber": "CERT-M1A2B3-X4Y5Z6",
    "issuedAt": "...",
    "courseTitle": "Intro to Python",
    "userName": "John Doe",
    "completedAt": "..."
  }
}
```

---

## Public Endpoints

### `GET /api/stats`

Get public platform statistics for the landing page.

**Auth:** Public

**Response:**

```json
{
  "stats": {
    "courses": 25,
    "learners": 150,
    "quizzes": 50,
    "completionRate": 72
  }
}
```

---

### `GET /api/site-settings`

Get public site settings for the landing page.

**Auth:** Public

**Response:**

```json
{
  "settings": {
    "platformName": "LearnSphere",
    "logoUrl": "https://...",
    "heroImageUrl": "https://...",
    "featuredImageUrl": "https://...",
    "currency": "INR",
    "footerTagline": "Empowering learners worldwide.",
    "footerLinks": {
      "platform": [
        { "label": "Courses", "href": "/dashboard/courses" }
      ],
      "resources": [
        { "label": "Help Center", "href": "/help" }
      ]
    },
    "testimonials": [
      {
        "name": "Jane Doe",
        "text": "Amazing platform!",
        "role": "Software Engineer",
        "rating": 5,
        "avatarColor": "#4F46E5"
      }
    ],
    "faqs": [
      {
        "question": "How do I enroll?",
        "answer": "Simply click the Enroll button on any course page."
      }
    ]
  }
}
```

---

## File Upload

### `POST /api/upload`

Upload a file to Vercel Blob storage.

**Auth:** Auth

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field    | Type   | Required | Description                              |
| -------- | ------ | -------- | ---------------------------------------- |
| `file`   | File   | ✅       | The file to upload                       |
| `folder` | string | ❌       | Storage folder (default: `"uploads"`)    |

**Allowed File Types:**

| Category   | Types                                          | Max Size |
| ---------- | ---------------------------------------------- | -------- |
| Images     | JPEG, PNG, WebP, GIF, SVG                      | 5 MB     |
| Documents  | PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT     | 25 MB    |

**Response:**

```json
{
  "url": "https://xxxxxx.public.blob.vercel-storage.com/uploads/1234567-photo.jpg",
  "pathname": "uploads/1234567-photo.jpg",
  "contentType": "image/jpeg",
  "size": 245678
}
```

---

### `DELETE /api/upload`

Delete a file from Vercel Blob storage.

**Auth:** Auth

**Request Body:**

| Field | Type   | Required | Description              |
| ----- | ------ | -------- | ------------------------ |
| `url` | string | ✅       | The blob URL to delete   |

**Response:** `200` — `{ "success": true }`

---

## Admin Endpoints

All admin endpoints require authentication and an `instructor` or `superadmin` role (unless noted otherwise).

---

### Admin Dashboard

#### `GET /api/admin/dashboard`

Get comprehensive dashboard statistics.

**Auth:** Admin (instructor or superadmin)

**Response:**

```json
{
  "userCounts": {
    "total": 100,
    "learners": 85,
    "instructors": 10,
    "superadmins": 5
  },
  "courseCounts": {
    "total": 25,
    "published": 20,
    "draft": 5,
    "totalViews": 5000
  },
  "lessonCount": 200,
  "quizCount": 50,
  "enrollmentCounts": {
    "total": 500,
    "notStarted": 50,
    "inProgress": 200,
    "completed": 250
  },
  "completionRate": 50,
  "quizAttemptStats": {
    "totalAttempts": 1000,
    "avgScore": 78,
    "totalPointsAwarded": 5000
  },
  "recentEnrollments": [
    {
      "id": "uuid",
      "status": "not_started",
      "enrolledAt": "...",
      "userName": "Jane",
      "userEmail": "jane@example.com",
      "courseTitle": "Python 101",
      "courseId": 1
    }
  ],
  "topCourses": [
    {
      "id": 1,
      "title": "Python 101",
      "published": true,
      "viewsCount": 500,
      "enrollmentCount": 100,
      "completedCount": 50
    }
  ]
}
```

**Notes:** Instructors see stats scoped to their own courses only. Superadmins see platform-wide stats.

---

### Admin Reporting

#### `GET /api/admin/reporting`

Get advanced per-course analytics with trend data.

**Auth:** Admin (instructor or superadmin)

**Query Parameters:**

| Param      | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| `courseId`  | number | Filter to a specific course (optional) |

**Response:**

```json
{
  "courses": [
    {
      "id": 1,
      "title": "Python 101",
      "imageUrl": "...",
      "published": true,
      "accessRule": "open",
      "price": null,
      "viewsCount": 500,
      "createdAt": "...",
      "enrollment": {
        "total": 100,
        "notStarted": 10,
        "inProgress": 40,
        "completed": 50,
        "completionRate": 50,
        "totalTimeSpentSeconds": 360000,
        "avgTimeSpentSeconds": 3600
      },
      "content": {
        "totalLessons": 10,
        "totalDurationSeconds": 7200
      },
      "quiz": {
        "totalQuizzes": 5,
        "totalAttempts": 200,
        "avgScore": 80,
        "totalPointsAwarded": 1500
      },
      "reviews": {
        "totalReviews": 25,
        "avgRating": 4.3
      }
    }
  ],
  "summary": {
    "totalCourses": 25,
    "totalEnrollments": 500,
    "totalCompleted": 250,
    "totalInProgress": 150,
    "totalNotStarted": 100,
    "totalViews": 5000,
    "overallCompletionRate": 50,
    "averageRating": 4.2,
    "totalTimeSpentSeconds": 1800000,
    "totalQuizAttempts": 1000,
    "averageQuizScore": 75
  },
  "trends": {
    "enrollments": [
      { "date": "2025-06-01", "count": 5 },
      { "date": "2025-06-02", "count": 3 }
    ],
    "completions": [
      { "date": "2025-06-01", "count": 2 }
    ]
  }
}
```

---

### Admin Users

#### `GET /api/admin/users`

List all users with filtering, search, and pagination.

**Auth:** Superadmin

**Query Parameters:**

| Param    | Type   | Default | Description                                    |
| -------- | ------ | ------- | ---------------------------------------------- |
| `page`   | number | `1`     | Page number                                    |
| `limit`  | number | `20`    | Users per page (max 100)                       |
| `search` | string | `""`    | Search by name or email                        |
| `role`   | string | `""`    | Filter: `superadmin`, `instructor`, `learner`  |
| `active` | string | `null`  | Filter: `"true"` or `"false"`                  |

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "learner",
      "avatarUrl": null,
      "isActive": true,
      "totalPoints": 150,
      "createdAt": "...",
      "updatedAt": "...",
      "enrollmentCount": 5,
      "courseCount": 0
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

#### `POST /api/admin/users`

Create a new user (instructor or learner).

**Auth:** Superadmin

**Request Body:**

| Field      | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| `name`     | string | ✅       | Display name (min 2 chars)                |
| `email`    | string | ✅       | Email address                             |
| `password` | string | ✅       | Password (min 6 chars)                    |
| `role`     | string | ❌       | `"instructor"` or `"learner"` (default: `"instructor"`) |

**Response:** `201` — `{ "user": { ... } }`

---

#### `GET /api/admin/users/[id]`

Get a single user's details.

**Auth:** Superadmin

**Response:** `200` — `{ "user": { ... } }`

---

#### `PATCH /api/admin/users/[id]`

Update a user's role or active status.

**Auth:** Superadmin

**Request Body:**

| Field      | Type    | Required | Description                                |
| ---------- | ------- | -------- | ------------------------------------------ |
| `role`     | string  | ❌       | `"superadmin"`, `"instructor"`, `"learner"`|
| `isActive` | boolean | ❌       | `true` or `false`                          |

**Notes:**
- Superadmins cannot change their own role or deactivate themselves.
- Deactivating a user immediately destroys all their active sessions.

**Response:** `200` — `{ "user": { ... updated ... } }`

---

### Admin Courses

#### `GET /api/admin/courses`

List courses for the admin panel.

**Auth:** Admin

**Notes:** Instructors see only their own courses. Superadmins see all courses.

**Response:** `200` — `{ "courses": [ ... ] }`

---

#### `POST /api/admin/courses`

Create a new course.

**Auth:** Admin

**Request Body:**

| Field         | Type     | Required | Description                                  |
| ------------- | -------- | -------- | -------------------------------------------- |
| `title`       | string   | ✅       | Course title (max 255 chars)                 |
| `description` | string   | ❌       | Course description                           |
| `imageUrl`    | string   | ❌       | Cover image URL                              |
| `visibility`  | string   | ❌       | `"everyone"` or `"signed_in"` (default: `"everyone"`) |
| `accessRule`  | string   | ❌       | `"open"`, `"invitation"`, `"payment"` (default: `"open"`) |
| `price`       | string   | ❌       | Price (required if `accessRule` is `"payment"`) |
| `published`   | boolean  | ❌       | Whether the course is published (default: `false`) |
| `tagIds`      | string[] | ❌       | Array of tag UUIDs to associate              |

**Response:** `201` — `{ "course": { ... , "tags": [ ... ] } }`

---

#### `GET /api/admin/courses/[id]`

Get a single course with tags (admin view).

**Auth:** Admin (owner or superadmin)

**Response:** `200` — `{ "course": { ... , "tags": [ ... ] } }`

---

#### `PATCH /api/admin/courses/[id]`

Update a course.

**Auth:** Admin (owner or superadmin)

**Request Body:** Same fields as `POST` (all optional). Include `tagIds` to sync tags.

**Response:** `200` — `{ "course": { ... , "tags": [ ... ] } }`

---

#### `DELETE /api/admin/courses/[id]`

Delete a course and all associated data (lessons, quizzes, enrollments, etc.).

**Auth:** Admin (owner or superadmin)

**Response:** `200` — `{ "message": "Course deleted" }`

---

### Admin Tags

#### `GET /api/admin/tags`

List all tags.

**Auth:** Admin

**Response:** `200` — `{ "tags": [ { "id": "uuid", "name": "Python" }, ... ] }`

---

#### `POST /api/admin/tags`

Create a new tag (or return existing if name matches).

**Auth:** Admin

**Request Body:**

| Field  | Type   | Required | Description                  |
| ------ | ------ | -------- | ---------------------------- |
| `name` | string | ✅       | Tag name (max 100 chars)     |

**Responses:**

| Status | Description                                       |
| ------ | ------------------------------------------------- |
| `201`  | `{ "tag": { "id", "name" } }` — New tag created  |
| `200`  | `{ "tag": { "id", "name" } }` — Existing tag returned |

---

#### `DELETE /api/admin/tags/[id]`

Delete a tag.

**Auth:** Admin

**Response:** `200` — `{ "message": "Tag deleted" }`

---

### Admin Badge Levels

#### `GET /api/admin/badge-levels`

List all badge levels sorted by sort order.

**Auth:** Superadmin

**Response:**

```json
{
  "badges": [
    {
      "id": "uuid",
      "name": "Bronze",
      "minPoints": 0,
      "sortOrder": 0
    },
    {
      "id": "uuid",
      "name": "Silver",
      "minPoints": 100,
      "sortOrder": 1
    }
  ]
}
```

---

#### `POST /api/admin/badge-levels`

Create a new badge level.

**Auth:** Superadmin

**Request Body:**

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| `name`      | string | ✅       | Badge name                           |
| `minPoints` | number | ✅       | Minimum points required (>= 0)      |
| `sortOrder` | number | ✅       | Display order                        |

**Response:** `201` — `{ "badge": { ... } }`

---

#### `PATCH /api/admin/badge-levels/[id]`

Update a badge level.

**Auth:** Superadmin

---

#### `DELETE /api/admin/badge-levels/[id]`

Delete a badge level.

**Auth:** Superadmin

---

### Admin Payments

#### `GET /api/admin/payments`

List payment records with filtering, search, sorting, and pagination.

**Auth:** Admin (instructor sees only their course payments; superadmin sees all)

**Query Parameters:**

| Param       | Type   | Default      | Description                                       |
| ----------- | ------ | ------------ | ------------------------------------------------- |
| `page`      | number | `1`          | Page number                                       |
| `limit`     | number | `20`         | Records per page (max 100)                        |
| `search`    | string | `""`         | Search user name/email, course title, Razorpay IDs|
| `status`    | string | `""`         | Filter: `pending`, `completed`, `failed`, `refunded` |
| `courseId`   | number | —            | Filter by course ID                               |
| `sortBy`    | string | `"createdAt"`| Sort: `createdAt`, `amount`, `status`, `userName`, `courseTitle` |
| `sortOrder` | string | `"desc"`     | `"asc"` or `"desc"`                               |

**Response:**

```json
{
  "payments": [
    {
      "id": "uuid",
      "userId": 1,
      "courseId": 5,
      "razorpayOrderId": "order_xxx",
      "razorpayPaymentId": "pay_xxx",
      "amount": "499.00",
      "currency": "INR",
      "status": "completed",
      "createdAt": "...",
      "updatedAt": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userAvatarUrl": null,
      "courseTitle": "Advanced Python",
      "courseImageUrl": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 },
  "summary": {
    "totalPayments": 50,
    "completedPayments": 40,
    "pendingPayments": 5,
    "failedPayments": 3,
    "refundedPayments": 2,
    "totalRevenue": 19960.00
  }
}
```

---

### Admin Site Settings

#### `GET /api/admin/site-settings`

Get all site settings (admin view with full detail).

**Auth:** Superadmin

**Response:** `200` — `{ "settings": { ... all fields including id ... } }`

---

#### `PATCH /api/admin/site-settings`

Update site settings (partial update — only send fields you want to change).

**Auth:** Superadmin

**Request Body:**

| Field             | Type          | Description                                              |
| ----------------- | ------------- | -------------------------------------------------------- |
| `platformName`    | string / null | Platform name (max 100 chars)                            |
| `logoUrl`         | string / null | Logo URL (max 500 chars)                                 |
| `heroImageUrl`    | string / null | Hero section image URL (max 500 chars)                   |
| `featuredImageUrl`| string / null | Featured image URL (max 500 chars)                       |
| `currency`        | string / null | Platform currency code, e.g. `"INR"` (max 10 chars)     |
| `footerTagline`   | string / null | Footer tagline text (max 500 chars)                      |
| `footerLinks`     | object / null | `{ "platform": [{label, href}], "resources": [{label, href}] }` |
| `testimonials`    | array / null  | Array of testimonial objects (max 20)                    |
| `faqs`            | array / null  | Array of FAQ objects (max 30)                            |

**Testimonial Object:**

| Field        | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `name`       | string | ✅       | Person's name                  |
| `text`       | string | ✅       | Testimonial text               |
| `role`       | string | ❌       | Person's role/title            |
| `rating`     | number | ❌       | Star rating (1–5)              |
| `avatarColor`| string | ❌       | Avatar background color (hex)  |

**FAQ Object:**

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `question` | string | ✅       | Question    |
| `answer`   | string | ✅       | Answer      |

**Response:** `200` — `{ "settings": { ... updated settings ... } }`

---

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

Some validation errors may include additional detail:

```json
{
  "error": "Password must be at least 8 characters",
  "errors": [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter"
  ]
}
```

### Common HTTP Status Codes

| Status | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| `200`  | Success                                                        |
| `201`  | Created successfully                                           |
| `400`  | Bad request — invalid input or validation error                |
| `401`  | Not authenticated — session missing or expired                 |
| `402`  | Payment required                                               |
| `403`  | Forbidden — insufficient permissions                           |
| `404`  | Resource not found                                             |
| `409`  | Conflict — resource already exists (duplicate email, enrollment, etc.) |
| `410`  | Gone — resource expired (e.g., OTP)                            |
| `429`  | Too many requests — rate limited                               |
| `500`  | Internal server error                                          |
| `503`  | Service unavailable — required service not configured          |