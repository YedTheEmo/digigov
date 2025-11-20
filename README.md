# DigiGov: Procure-to-Pay Status Tracker

## System Summary

DigiGov is an integrated **end-to-end procurement, logistics, and financial workflow system** for government agencies. It tracks all stages of a procurement case, from initial creation and posting, through evaluation and award, and continuing downstream to delivery, inspection, acceptance, obligation, disbursement, and final payment.

The platform provides:

* Structured workflows aligned with RA 9184 and RA 12009
* Full case lifecycle transparency
* A unified data model covering procurement, supply, budget, accounting, and cashier operations
* Document and attachment management
* Role-based access and complete audit trails


---

## Application Features

### Procurement Management

* Small Value RFQ workflow
* Public Bidding and Infrastructure workflows
* Posting, RFQ issuance, bid recording, evaluations, awards
* Contract and NTP management
* Automated generation of essential documents (e.g., abstracts)

### Supply Chain

* Delivery recording and tracking
* Inspection and acceptance workflows
* Support for infrastructure-specific PMT inspections
* Integration points for supply and asset management

### Financial Workflows

* Budget: ORS handling and validation
* Accounting: DV preparation, linking, and review
* Cashier: Check issuance and check advice
* Controlled sequencing: ORS → DV → Check → Close

### Role-Based Access

Granular RBAC for Procurement, BAC Secretariat, TWG, Supply, Budget, Accounting, Cashier, Approvers, and Admin.

---

## Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Styling:** Tailwind CSS 4
* **Authentication:** NextAuth.js
* **Storage:** Local or S3-compatible storage
* **Hosting:** Designed for Vercel deployment

---

## Prerequisites

* Node.js 20+
* PostgreSQL instance (local or managed service such as Neon)

---

## Setup Instructions

### Clone the Repository

```bash
git clone <repository-url>
cd digigov
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create `.env.local` with:

```bash
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-at-least-32-chars"
AUTH_TRUST_HOST=true

# Optional integrations:
# RESEND_API_KEY=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# S3_BUCKET=
# VERCEL_CRON_SECRET=
```

### Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Seed Data

```bash
npm run db:seed
```

Initial accounts and roles are defined in `prisma/seed.ts`.

### Run the Application

```bash
npm run dev
```

Access the application at `http://localhost:3000`.