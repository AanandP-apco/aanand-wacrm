# Aanand & Co — WhatsApp CRM

> **Self-hosted WhatsApp CRM for Aanand & Co** — shared inbox, client contacts, deal pipelines, broadcast campaigns, no-code automations, and AI customer support assistants.

---

## 🌟 Overview & Key Features

Aanand & Co WhatsApp CRM is an enterprise-grade, privacy-first communication and sales management system built directly on the official **Meta WhatsApp Cloud API**, **Next.js (App Router)**, and **Supabase (Postgres + RLS + Auth)**.

- 💬 **Shared Inbox** — Multi-agent collaboration on official WhatsApp Business numbers. Assign conversations, track statuses, leave internal notes, and send rich media messages.
- 👥 **Contacts & Segmentation** — Centralized client database with custom fields, business-scoped identification, automated deduplication, and tag filtering.
- 📊 **Visual Sales Pipelines (Kanban)** — Drag-and-drop deal tracking linked directly to customer conversations. Supports multiple currencies (INR, USD, etc.).
- 📢 **Broadcast Campaigns** — Send personalized Meta-approved template broadcasts with real-time delivery, read-rate tracking, and automated retries.
- ⚡ **No-Code Automations & Visual Flows** — Automate welcome greetings, out-of-office notices, lead qualification, and multi-step interactive customer menus.
- 🤖 **AI Assistant & Knowledge Base** — Bring your own OpenAI or Anthropic key (stored encrypted with AES-256-GCM). Train on Aanand & Co company FAQs, policies, and service documents via full-text search or semantic pgvector.
- 🛡️ **Role-Based Access Control** — Granular permissions for Owners, Admins, Agents, and Viewers.
- 🔌 **API & MCP Server** — Public REST API (`/api/v1`) and Model Context Protocol (MCP) server for integration with AI assistants and custom workflows.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v22.12.0 or higher
- **npm**: v10.9.0 or higher
- **Supabase project**: Free or Pro tier ([supabase.com](https://supabase.com))
- **Meta for Developers Account**: For WhatsApp Cloud API ([developers.facebook.com](https://developers.facebook.com))

### 2. Environment Setup
The project comes with a pre-configured `.env.local` containing a freshly generated 32-byte AES-256-GCM encryption key.

Open `.env.local` and add your Supabase and Meta credentials:

```bash
# Supabase Configuration (Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp Token Encryption (Pre-generated for Aanand & Co)
ENCRYPTION_KEY=fa1f7a3a3c2272b581822369b93fdcf64b32b5dc83303514975715f780a366f4

# Meta WhatsApp Cloud API (developers.facebook.com -> App Dashboard)
META_APP_SECRET=your-meta-app-secret
META_APP_ID=your-meta-app-id

# Domain & Localization
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_LOCALE=en
```

### 3. Database Migration
To set up all required tables, triggers, storage buckets, and row-level security (RLS) policies in Supabase:

1. Open your Supabase Dashboard: **SQL Editor**.
2. Open the file [`supabase/setup_aanand_and_co.sql`](./supabase/setup_aanand_and_co.sql).
3. Copy the entire contents, paste them into the SQL Editor, and click **Run**.
4. All 58 migrations will execute in order, establishing the database schema, storage buckets (`chat-media`, `flow-media`, `profile-avatars`), and security definitions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the Aanand & Co login screen.

---

## 📱 Meta WhatsApp Cloud API Setup

1. **Create a Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com) → **My Apps** → **Create App**.
   - Select **Other** → **Business**.
   - Add the **WhatsApp** product to your app.

2. **Retrieve Credentials**:
   - Go to **WhatsApp** → **API Setup**.
   - Note your **Phone Number ID** and **WhatsApp Business Account ID (WABA ID)**.
   - Create a permanent System User Access Token in **Meta Business Suite** with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.

3. **Configure Webhook**:
   - Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify Token: Configure any secure string in your WhatsApp settings inside the CRM dashboard.
   - Webhook Subscription Fields: Check `messages` and `message_template_status_update`.

4. **Connect inside the CRM**:
   - Sign up / Sign in to the CRM.
   - Navigate to **Settings** → **WhatsApp Integration**.
   - Paste your **Phone Number ID**, **WABA ID**, and **System User Access Token**, then click **Save & Test Connection**.

---

## 🛠️ Testing & Verification

Run the test suite and type check:

```bash
# Run all vitest unit & integration tests (1,728 tests)
npm test

# Verify TypeScript type safety
npm run typecheck

# Build for production
npm run build
```

---

## 🏢 Customizations for Aanand & Co

- **Brand Visuals**: Custom monogram logo, favicon, and brand accents (`src/app/icon.tsx`, `src/components/layout/sidebar.tsx`).
- **Auth Shells**: Tailored sign-in, account creation, password recovery, and invitation workflows.
- **Language Catalogs**: Branded translation strings across English, Spanish, Korean, and Brazilian Portuguese.
- **Pre-packaged Database Script**: Consolidated `supabase/setup_aanand_and_co.sql` for instant Supabase provisioning.

---

## 📄 License

MIT License. Crafted for **Aanand & Co**.
