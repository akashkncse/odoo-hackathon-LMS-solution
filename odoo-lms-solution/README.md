# LearnSphere LMS — Learning Management System

A full-featured **Learning Management System** built with **Next.js 16**, **Drizzle ORM**, and **Neon (PostgreSQL)**. Designed for organizations and educators to create, manage, and deliver courses with quizzes, certificates, discussions, gamification, and integrated payments.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Seed the Superadmin](#seed-the-superadmin)
  - [Run the Development Server](#run-the-development-server)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Key Modules](#key-modules)
  - [Authentication & OTP](#authentication--otp)
  - [Course Management](#course-management)
  - [Lessons & Content](#lessons--content)
  - [Quizzes & Gamification](#quizzes--gamification)
  - [Enrollments & Progress Tracking](#enrollments--progress-tracking)
  - [Certificates](#certificates)
  - [Payments (Razorpay)](#payments-razorpay)
  - [Reviews & Ratings](#reviews--ratings)
  - [Discussions](#discussions)
  - [Invitations](#invitations)
  - [Leaderboard & Badges](#leaderboard--badges)
  - [Admin Dashboard & Reporting](#admin-dashboard--reporting)
  - [Site Settings & Landing Page CMS](#site-settings--landing-page-cms)
  - [File Uploads](#file-uploads)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Local Development (Optional)](#local-development-optional)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [License](#license)

---

## Features

- **OTP-based Email Verification** — Signup and forgot-password flows with 6-digit OTP codes sent via SMTP
- **Role-based Access Control** — Three roles: Superadmin, Instructor, and Learner
- **Course Builder** — Create courses with multiple lessons (video, document, image, quiz), tags, visibility settings, and access rules (open, invitation-only, paid)
- **Quiz Engine** — Multiple-choice quizzes with configurable point rewards per attempt, score tracking, and automatic grading
- **Progress Tracking** — Per-lesson progress, enrollment status management, time-spent tracking, and completion detection
- **Certificates** — Auto-generated certificates with unique certificate numbers and public verification URLs
- **Payments** — Razorpay integration with full order creation, HMAC signature verification, and a built-in test mode for development
- **Gamification** — Points system, badge levels, and a global leaderboard
- **Reviews & Ratings** — Star ratings and written reviews from enrolled learners, with aggregate stats and distribution
- **Discussion Forum** — Global threaded discussions with replies, pinning, and archiving
- **Course Invitations** — Invite specific users by email to invitation-only courses
- **Admin Dashboard** — Real-time stats on users, courses, enrollments, quiz performance, and revenue
- **Advanced Reporting** — Per-course analytics with enrollment/completion trends (30-day charts)
- **Landing Page CMS** — Superadmin-controlled landing page content: hero, footer, testimonials, FAQs, and platform branding
- **File Uploads** — Vercel Blob-backed uploads for images and documents with type/size validation
- **Dark Mode** — Built-in dark/light theme support via `next-themes`
- **Responsive UI** — Mobile-friendly design using Tailwind CSS and Radix UI components

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| **Framework**    | [Next.js 16](https://nextjs.org/) (App Router)               |
| **Language**     | TypeScript 5                                                  |
| **Database**     | PostgreSQL via [Neon](https://neon.tech/) (serverless)        |
| **ORM**          | [Drizzle ORM](https://orm.drizzle.team/)                     |
| **Auth**         | Cookie-based sessions with bcrypt password hashing            |
| **Email**        | [Nodemailer](https://nodemailer.com/) (Gmail SMTP)           |
| **Payments**     | [Razorpay](https://razorpay.com/)                            |
| **File Storage** | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)   |
| **Styling**      | [Tailwind CSS 4](https://tailwindcss.com/) + Radix UI        |
| **Animations**   | [Motion](https://motion.dev/) (Framer Motion successor)      |
| **Deployment**   | [Vercel](https://vercel.com/)                                |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Next.js App Router                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Public Pages │  │  Dashboard   │  │   Admin    │ │
│  │  (Landing,    │  │  (Learner    │  │  (Courses, │ │
│  │   Login,      │  │   Courses,   │  │   Users,   │ │
│  │   Signup)     │  │   Quizzes)   │  │   Reports) │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                         │                            │
│  ┌──────────────────────▼──────────────────────────┐ │
│  │              API Routes (/api/*)                 │ │
│  │   Auth · Courses · Quizzes · Payments · Admin   │ │
│  └──────────────────────┬──────────────────────────┘ │
│                         │                            │
│  ┌──────────────────────▼──────────────────────────┐ │
│  │       Drizzle ORM + Neon Serverless Driver      │ │
│  └──────────────────────┬──────────────────────────┘ │
└─────────────────────────┼────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Neon PostgreSQL DB  │
              └───────────────────────┘
```

The app follows a **monolithic Next.js architecture** with:
- **Server-side API routes** for all backend logic (no separate backend)
- **Cookie-based session auth** via `httpOnly` cookies with server-side token verification
- **Middleware** protecting all non-public routes and redirecting unauthenticated users

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (comes with Node.js)
- A **Neon** database account (free tier available at [neon.tech](https://neon.tech/))
- A **Gmail** account with an App Password for SMTP (or any SMTP provider)
- *(Optional)* A **Razorpay** account for payment processing
- *(Optional)* A **Vercel Blob** token for file uploads

### Installation

```bash
git clone <your-repo-url>
cd odoo-lms-solution
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Database (Neon PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/lms?sslmode=require

# Email (Gmail SMTP — use an App Password, NOT your account password)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# Admin Seeding
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password

# Razorpay (optional — omit for test mode)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Vercel Blob (optional — needed for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxx
```

| Variable               | Required | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`         | ✅       | Neon PostgreSQL connection string                        |
| `SMTP_EMAIL`           | ✅       | Gmail address for sending OTP emails                     |
| `SMTP_PASSWORD`        | ✅       | Gmail App Password (16-char code from Google settings)   |
| `ADMIN_EMAIL`          | ✅       | Email for the initial superadmin account (used by seed)  |
| `ADMIN_PASSWORD`       | ✅       | Password for the initial superadmin account              |
| `RAZORPAY_KEY_ID`      | ❌       | Razorpay API Key ID (payment gateway)                   |
| `RAZORPAY_KEY_SECRET`  | ❌       | Razorpay API Key Secret                                  |
| `BLOB_READ_WRITE_TOKEN`| ❌       | Vercel Blob storage token for file uploads               |

> **Note:** If Razorpay keys are omitted, the payment system automatically runs in **test mode** — a mock checkout flow that simulates the full payment experience without real charges.

### Database Setup

Push the schema to your Neon database:

```bash
npx drizzle-kit push
```

This creates all the tables, enums, and relationships defined in `lib/db/schema.ts`.

### Seed the Superadmin

Create the initial superadmin account:

```bash
npx tsx scripts/seed-admin.ts
```

This reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local` and creates the superadmin user.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Log in at `/login` with your superadmin credentials.

---

## Project Structure

```
odoo-lms-solution/
├── app/
│   ├── api/                    # All API routes (see API Reference)
│   │   ├── admin/              # Admin-only endpoints
│   │   │   ├── badge-levels/   # Badge CRUD
│   │   │   ├── courses/        # Course management (admin)
│   │   │   ├── dashboard/      # Admin dashboard stats
│   │   │   ├── payments/       # Payment records
│   │   │   ├── reporting/      # Advanced analytics
│   │   │   ├── site-settings/  # Landing page CMS
│   │   │   ├── tags/           # Tag management
│   │   │   └── users/          # User management
│   │   ├── auth/               # Auth endpoints
│   │   │   ├── forgot-password/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── me/
│   │   │   ├── reset-password/
│   │   │   ├── send-otp/
│   │   │   ├── signup/
│   │   │   └── verify-otp/
│   │   ├── certificates/       # Public certificate verification
│   │   ├── courses/            # Public course catalog & details
│   │   │   └── [id]/
│   │   │       ├── certificate/
│   │   │       ├── enroll/
│   │   │       ├── lessons/
│   │   │       ├── quizzes/
│   │   │       ├── reviews/
│   │   │       └── view/
│   │   ├── discussions/        # Discussion forum
│   │   ├── invitations/        # Course invitations
│   │   ├── leaderboard/        # Points leaderboard
│   │   ├── me/                 # Current user endpoints
│   │   │   ├── enrollments/
│   │   │   ├── password/
│   │   │   ├── points/
│   │   │   └── profile/
│   │   ├── payments/           # Payment flow
│   │   ├── site-settings/      # Public site settings
│   │   ├── stats/              # Public platform stats
│   │   └── upload/             # File upload
│   ├── admin/                  # Admin UI pages
│   │   ├── badge-levels/
│   │   ├── courses/
│   │   ├── discussions/
│   │   ├── landing-page/       # Landing page CMS UI
│   │   ├── payments/
│   │   ├── profile/
│   │   ├── reporting/
│   │   └── users/
│   ├── dashboard/              # Learner dashboard pages
│   │   ├── courses/
│   │   ├── discussions/
│   │   ├── invitations/
│   │   ├── my-learning/
│   │   ├── points/
│   │   └── profile/
│   ├── forgot-password/        # Forgot password page
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page (with OTP)
│   └── verify/                 # Certificate verification page
├── components/
│   ├── landing/                # Landing page sections
│   │   ├── cta.tsx
│   │   ├── faq.tsx
│   │   ├── features.tsx
│   │   ├── footer.tsx
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   ├── navbar.tsx
│   │   ├── stats.tsx
│   │   └── testimonials.tsx
│   ├── ui/                     # Reusable UI components (shadcn)
│   ├── admin-sidebar.tsx
│   ├── course-form.tsx
│   ├── discussions-page.tsx
│   ├── forgot-password-form.tsx
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   ├── quiz-editor.tsx
│   ├── quiz-runner.tsx
│   └── ...
├── lib/
│   ├── db/
│   │   ├── index.ts            # Neon DB connection (production)
│   │   └── schema.ts           # Drizzle schema (all tables)
│   ├── auth.ts                 # Session management & password hashing
│   ├── currency.ts             # Currency conversion helpers
│   ├── email.ts                # Nodemailer OTP email sender
│   ├── razorpay.ts             # Razorpay client initialization
│   ├── utils.ts                # General utilities
│   └── validation.ts           # Password validation rules
├── scripts/
│   ├── seed-admin.ts           # Seed superadmin (Neon)
│   ├── seed-admin-local.ts     # Seed superadmin (local Postgres)
│   └── flush.ts                # Flush database utility
├── middleware.ts                # Route protection middleware
├── drizzle.config.ts           # Drizzle Kit config (Neon)
└── package.json
```

---

## User Roles

| Role          | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| **Superadmin**| Full platform access. Manage users, all courses, site settings, badges, and reports. |
| **Instructor**| Create and manage their own courses, lessons, quizzes. View reports for their courses. |
| **Learner**   | Browse courses, enroll, take lessons and quizzes, earn points, leave reviews.    |

---

## Key Modules

### Authentication & OTP

- **Signup**: Multi-step flow → enter details → receive 6-digit OTP via email → verify → account created & auto-logged-in
- **Login**: Email + password → cookie-based session created
- **Forgot Password**: Enter email → receive OTP → verify → set new password
- **Session Management**: Server-side sessions stored in the database with `httpOnly` cookie tokens
- **Rate Limiting**: OTP requests are rate-limited to one per 60 seconds; max 5 verification attempts per code

### Course Management

- Courses support **visibility** control (`everyone` or `signed_in`) and **access rules** (`open`, `invitation`, `payment`)
- Tag-based categorization with full-text search across title, description, and tags
- Sorting by newest, oldest, popularity (views), title, or rating
- Paginated catalog with review stats (average rating, total reviews)

### Lessons & Content

- Four lesson types: **Video**, **Document**, **Image**, **Quiz**
- Ordered lesson lists with drag-and-drop reordering (sort order)
- File attachments per lesson (files or external links)
- Video duration tracking

### Quizzes & Gamification

- Multiple-choice questions with configurable answer options
- **Tiered point rewards**: different point values for 1st, 2nd, 3rd, and 4th+ attempts
- Automatic grading with score calculation
- Points automatically added to the user's total, contributing to the leaderboard

### Enrollments & Progress Tracking

- Three enrollment states: `not_started`, `in_progress`, `completed`
- Per-lesson progress tracking (not started → in progress → completed)
- Automatic enrollment status updates based on lesson completion
- Time-spent tracking (seconds)

### Certificates

- Generated upon course completion with a unique certificate number (`CERT-XXXXXX-XXXXXX`)
- Idempotent generation — requesting a certificate multiple times returns the same one
- Public verification at `/verify/[certificateNumber]`
- Includes course title, learner name, completion date, and total lessons

### Payments (Razorpay)

- Full Razorpay integration: order creation → client-side checkout → HMAC-SHA256 signature verification
- **Test Mode**: When `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are not set, the system simulates the entire payment flow with mock order IDs
- Automatic enrollment creation upon successful payment
- Payment records with status tracking (pending, completed, failed, refunded)
- Multi-currency support via site settings

### Reviews & Ratings

- Enrolled learners can leave 1–5 star ratings with optional text reviews
- One review per user per course (update or delete supported)
- Aggregate stats: average rating, total reviews, rating distribution (1–5)
- Paginated review lists with user info

### Discussions

- Global discussion forum (not course-specific)
- Threaded conversations with replies
- Admins can pin and archive threads
- Reply counts and last-reply timestamps

### Invitations

- Instructors/admins can invite users by email to invitation-only courses
- Learners see pending invitations in their dashboard
- Accept → auto-enrolls; decline → deletes the invitation

### Leaderboard & Badges

- Global leaderboard ranked by total points
- Configurable badge levels (e.g., Bronze at 100pts, Silver at 500pts, Gold at 1000pts)
- Each user sees their current badge and progress toward the next one
- Superadmin manages badge levels through the admin panel

### Admin Dashboard & Reporting

- **Dashboard**: User counts by role, course stats, enrollment breakdown, quiz performance, top courses, recent enrollments
- **Reporting**: Per-course deep-dive with enrollment/completion/quiz/review stats, plus 30-day enrollment and completion trend charts
- Instructors see only their own courses; superadmins see everything

### Site Settings & Landing Page CMS

The superadmin can customize the public landing page without code changes:

- **Platform branding**: Name, logo URL, hero image, featured image
- **Currency**: Configure the platform currency (INR, USD, EUR, etc.)
- **Footer**: Custom tagline and link lists (Platform links, Resource links) with live preview
- **Testimonials**: Add/edit/reorder/delete testimonials with name, text, role, rating, and avatar color
- **FAQs**: Add/edit/reorder/delete FAQ entries with question and answer

All landing page components accept dynamic content from the database and fall back to sensible defaults when no custom content is configured.

### File Uploads

- Vercel Blob-backed storage for images and documents
- **Images**: JPEG, PNG, WebP, GIF, SVG (max 5MB)
- **Documents**: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT (max 25MB)
- Upload and delete operations with authentication

---

## Database Schema

The database consists of 20 tables. Key entities:

| Table                  | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `users`                | All platform users (with role and points)      |
| `sessions`             | Active user sessions                           |
| `otp_codes`            | OTP codes for signup and password reset         |
| `courses`              | Course catalog                                 |
| `tags` / `course_tags` | Tags and course-tag associations               |
| `lessons`              | Lesson content within courses                  |
| `lesson_attachments`   | Files/links attached to lessons                |
| `quizzes`              | Quizzes with point configuration               |
| `quiz_questions`       | Questions within quizzes                       |
| `quiz_options`         | Answer options per question                    |
| `quiz_attempts`        | User quiz attempt records                      |
| `quiz_responses`       | Per-question responses within an attempt       |
| `enrollments`          | User-course enrollment records                 |
| `lesson_progress`      | Per-lesson completion tracking                 |
| `reviews`              | Course reviews and ratings                     |
| `certificates`         | Issued completion certificates                 |
| `course_invitations`   | Email invitations to courses                   |
| `badge_levels`         | Gamification badge thresholds                  |
| `payments`             | Payment transaction records                    |
| `discussion_threads`   | Discussion forum threads                       |
| `discussion_replies`   | Replies within discussion threads              |
| `site_settings`        | Platform configuration and landing page content|

The full schema is defined in [`lib/db/schema.ts`](lib/db/schema.ts) using Drizzle ORM's type-safe schema builder.

---

## API Reference

For a complete API reference with all endpoints, request/response schemas, and authentication requirements, see **[API_README.md](API_README.md)**.

Quick overview of endpoint groups:

| Prefix                      | Description                    | Auth Required |
| --------------------------- | ------------------------------ | ------------- |
| `/api/auth/*`               | Login, signup, OTP, password   | Varies        |
| `/api/courses`              | Public course catalog          | No            |
| `/api/courses/[id]`         | Course detail + sub-resources  | Varies        |
| `/api/me/*`                 | Current user profile & data    | Yes           |
| `/api/discussions`          | Discussion forum               | Yes           |
| `/api/invitations`          | Course invitations             | Yes           |
| `/api/leaderboard`          | Points leaderboard             | Yes           |
| `/api/payments/*`           | Payment order & verification   | Yes           |
| `/api/certificates/*`       | Public certificate verification| No            |
| `/api/site-settings`        | Public site settings           | No            |
| `/api/stats`                | Public platform statistics     | No            |
| `/api/upload`               | File upload/delete             | Yes           |
| `/api/admin/*`              | Admin-only management          | Admin         |

---

## Local Development (Optional)

If you want to develop against a **local PostgreSQL** instance instead of Neon:

1. Start a local PostgreSQL server (e.g., via Docker):
   ```bash
   docker run --name lms-postgres -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres
   ```

2. Create the database:
   ```bash
   docker exec -it lms-postgres psql -U postgres -c "CREATE DATABASE lms;"
   ```

3. Create `lib/db/indexlocal.ts` (gitignored) with a local connection:
   ```typescript
   import { drizzle } from "drizzle-orm/node-postgres";
   import { Pool } from "pg";

   const pool = new Pool({
     connectionString: "postgresql://postgres:123@localhost:5432/lms",
   });

   export const db = drizzle(pool);
   ```

4. Create `drizzle.config.local.ts` (gitignored):
   ```typescript
   import { defineConfig } from "drizzle-kit";

   export default defineConfig({
     schema: "./lib/db/schema.ts",
     out: "./drizzle",
     dialect: "postgresql",
     dbCredentials: {
       url: "postgresql://postgres:123@localhost:5432/lms",
     },
   });
   ```

5. Push schema and seed locally:
   ```bash
   npx drizzle-kit push --config=drizzle.config.local.ts
   npx tsx scripts/seed-admin-local.ts
   ```

> **Note:** The files `lib/db/indexlocal.ts` and `drizzle.config.local.ts` are listed in `.gitignore` to prevent accidental commits.

---

## Deployment

### Vercel (Recommended)

1. Push the project to a GitHub repository
2. Import the repository on [vercel.com](https://vercel.com/)
3. Add all environment variables in the Vercel project settings
4. Deploy — Vercel will auto-detect Next.js and build the project
5. After the first deploy, run the seed script locally against the production database:
   ```bash
   DATABASE_URL="your-neon-production-url" npx tsx scripts/seed-admin.ts
   ```

### Build Commands

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Security Considerations

- **Passwords** are hashed with `bcryptjs` before storage — never stored in plain text
- **Sessions** use `httpOnly` cookies to prevent XSS-based session theft
- **OTP codes** have a 10-minute expiry, 5 max verification attempts, and 60-second rate limiting
- **Payment signatures** are verified using HMAC-SHA256 to prevent tampering
- **Input validation** is performed on all API endpoints with early returns for invalid data
- **Email enumeration protection**: forgot-password always returns a success message regardless of whether the email exists

### Production Recommendations

- Replace Gmail SMTP with a transactional email provider (SendGrid, Resend, Mailgun) for reliability
- Add IP-based rate limiting on auth endpoints (consider a WAF or middleware)
- Enable HTTPS everywhere (automatic on Vercel)
- Rotate `RAZORPAY_KEY_SECRET` and `BLOB_READ_WRITE_TOKEN` periodically
- Set up monitoring for failed OTP attempts and payment failures
- Consider adding CSRF protection for sensitive form submissions

---

## License

This project was built as part of the Odoo Hackathon. See the repository for license details.