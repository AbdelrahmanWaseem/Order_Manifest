# Order Manifest — Essentials EG 🇪🇬

Production internal operations tool for **Essentials EG**, built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL (Prisma)**. 

The application connects directly to the **Shopify Admin GraphQL API** to ingest real orders, display interactive paper-style pick/pack tickets with perforations, manage item fulfillment statuses (Ready, Incoming, Missing), warn against multi-order and inventory stock conflicts, and generate archival shipment reports with PDF printing, CSV export, and batch editing.

---

## Features

- **Direct Shopify GraphQL Ingestion**:
  - **Live Store Browser**: Search and paginate recent Shopify orders, select individual or multiple orders, and import them in one click.
  - **Fast Paste Lookup**: Paste multiple order numbers (e.g. `1001, 1002, #1005`, separated by commas, spaces, or newlines). Auto-fetches immediately upon paste.
  - **Not-Found Warnings**: Unmatched order numbers trigger explicit red warning notices.
  - **Duplicate Prevention**: Skips orders already active in the current batch.
  - **Auto-scroll**: Automatically scrolls directly to the first imported ticket.
- **Physical Ticket Board UI**:
  - Authentic operations dashboard styling (near-black `#14151a` background with cream `#ece3cd` paper cards and perforated left edges).
  - Shows order #, SKU, product title, vendor/brand color dot, size/variant, quantity, and live Shopify inventory levels.
  - Pre-suggests Ready when stock covers quantity (never auto-stamps).
  - Rotated status stamp overlays (`-9deg`) with one-click undo.
  - Cycle statuses (`Pending` &rarr; `Ready` &rarr; `Incoming` &rarr; `Missing`) by clicking the item title or stamp.
  - Individual inline note field per item (preserved across batch edits).
  - "Mark all ready" per customer order and "Mark all remaining Ready" for the entire batch.
  - Customer / Order # search filter and clickable live status chips.
- **Stock-Conflict Intelligence**:
  - Live warning banner whenever the same item (brand + name + size) is stamped `READY` on more than one order.
  - Flags when marked Ready quantity exceeds available Shopify inventory count or when stock is zero.
- **Shipment Report & Archive**:
  - Summary metrics cards (Ready to ship, Incoming, Missing, Pending).
  - Order cards with status badges (`Ship now`, `Missing items`, `Waiting on stock`, `Needs review`). Fully-ready orders collapse by default.
  - Brand breakdown summary table.
  - Actions: **Copy ready order #s**, **Edit this batch** (resets statuses to pending while preserving notes), **Export CSV**, and **Print / Save PDF**.
  - Permanent snapshot persistence in PostgreSQL. Active board only clears after persistence is confirmed.
  - Saved Reports Archive grouped by **Month** and **Day** with timestamps and counts. Reopen and export any historical report at any time.
- **Security & Authentication**:
  - Protected team access via shared password (`APP_PASSWORD`).
  - Secure `httpOnly`, `sameSite: lax`, `secure` session cookie signed with HS256 (`AUTH_SECRET`).
  - In-memory rate limiting against brute-force password guessing.
  - Zero browser exposure of the Shopify Admin API token.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma with PostgreSQL (Neon / Vercel Postgres / Supabase)
- **Icons**: Lucide React
- **Authentication**: JWT session tokens via `jose`

---

## Step-by-Step Setup Guide

### 1. Shopify Custom App Setup
1. Log in to your Shopify Admin (`https://admin.shopify.com/store/221224-9e`).
2. Go to **Settings** &rarr; **Apps and sales channels** &rarr; **Develop apps**.
3. Click **Create an app** and name it `Order Manifest Ops`.
4. Click **Configure Admin API scopes**:
   - `read_orders` (access customer orders and line items)
   - `read_products` (access product variants and vendor info)
   - `read_inventory` (access real-time inventory levels)
5. Click **Save**, then click **Install app**.
6. Under **API credentials**, copy the **Admin API access token** (starts with `shpat_...`).
   > *Note: This token is only revealed once. Store it securely.*

### 2. Database Setup (Neon or Vercel Postgres)
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or in your Vercel Project under the **Storage** tab (Vercel Postgres).
2. Copy the pooled connection string (`DATABASE_URL`). It typically looks like:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Local Development

1. Clone or navigate to the project directory:
   ```bash
   cd "Essentials orders handling tools"
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
   SHOPIFY_STORE_DOMAIN="221224-9e.myshopify.com"
   SHOPIFY_ADMIN_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   SHOPIFY_API_VERSION="2024-07"
   APP_PASSWORD="your-team-password-here"
   AUTH_SECRET="a-random-32-character-secret-key"
   ```

4. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Deployment to Vercel

### Option A: Via Vercel CLI
1. Install and login to Vercel:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Link and deploy the project:
   ```bash
   vercel
   ```
3. Add the production environment variables in your Vercel Project Settings:
   - `DATABASE_URL`
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ADMIN_TOKEN`
   - `SHOPIFY_API_VERSION` (`2024-07`)
   - `APP_PASSWORD`
   - `AUTH_SECRET`
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Via GitHub Repository
1. Push this directory to your GitHub account (e.g. `Essentials-Order-Manifest`).
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In the **Environment Variables** section, paste all variables from `.env.example`.
4. Click **Deploy**. Vercel will automatically run `prisma generate && next build` and provide your live URL.

---

## Verification & Test Plan

Run this test plan against your live store:
1. **Authentication Check**:
   - Access the homepage unauthenticated &rarr; Verify the password screen appears.
   - Enter an incorrect password &rarr; Verify error notice appears and rate limiting activates on repeated failures.
   - Enter `APP_PASSWORD` &rarr; Verify terminal unlocks and reveals the manifest dashboard.
2. **Shopify Order Browser**:
   - Click "Browse Shopify Store" &rarr; Verify recent live orders, customer names, line item titles, and totals load.
   - Search for a customer name &rarr; Verify filtered results.
   - Select 2 orders and click "Import Selected" &rarr; Verify they appear on the board grouped by customer with perforated paper tickets.
3. **Manual Paste Import**:
   - In "Paste Order #s", enter real order numbers (e.g. `1001, 1002`) and one non-existent number (e.g. `999999`).
   - Click "Fetch from Shopify" &rarr; Verify the real orders import, while `#999999` appears in the red "Not found in Shopify" notice.
   - Re-paste an existing order number &rarr; Verify it is skipped as a duplicate.
4. **Ticket Stamping & Stock Conflicts**:
   - On an item, click `READY`, `INCOMING`, or `MISSING` &rarr; Verify rotated stamp overlay appears.
   - Click the item title or stamp &rarr; Verify it cycles between statuses.
   - If the same item (brand + name + size) is marked `READY` across two orders &rarr; Verify the prominent yellow/orange conflict banner appears.
   - Type a note on a ticket (e.g. `arriving in next shipment`) &rarr; Verify it persists.
5. **Report Generation & Database Archival**:
   - Click "Generate report" &rarr; Verify report displays summary cards, order cards (fully ready orders collapsed), brand breakdown, and stock conflicts.
   - Verify the active board is cleared.
   - Click "📁 Saved reports" &rarr; Verify the new report appears grouped under today's date with order and item counts.
   - Click the saved report &rarr; Verify the snapshot reopens.
   - Click "Edit this batch" &rarr; Verify board is restored with notes preserved and statuses reset to pending.
   - Click "Copy ready order #s", "Export CSV", and "Print / save as PDF" &rarr; Verify all export actions function as expected.
