# Euroform - GDPR-Compliant Form Builder

A dead-simple form builder SaaS for European small businesses, built with GDPR compliance in mind.

## Features

- 🔐 Secure authentication with Supabase
- 📋 Simple form builder with essential field types
- 🌍 EU-hosted infrastructure (Supabase EU, Hetzner Cloud)
- 📧 Email notifications via Mailjet (EU)
- 📱 Responsive design with Tailwind CSS
- 🔗 Embeddable forms via iframe

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database/Auth/Storage**: Supabase (EU region)
- **Email**: Mailjet API (Frankfurt)
- **Hosting**: Hetzner Cloud (EU)

## Development Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Set up environment variables (see `.env.example`)

3. Start development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
euroform/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

## GDPR Compliance

- All data stored in EU region (Supabase EU)
- Minimal data collection
- File auto-deletion after 24 hours
- No tracking cookies
- SSL/TLS encryption everywhere
