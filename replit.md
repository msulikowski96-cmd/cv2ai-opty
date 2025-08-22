# CV Optimizer Pro

## Overview

CV Optimizer Pro is a full-stack web application that uses AI to optimize CVs and career documents. The application provides CV analysis, ATS compatibility checking, AI-powered content optimization, recruiter feedback generation, and cover letter creation. It features a tiered pricing model with Basic and Premium plans, Stripe payment integration, and a comprehensive user dashboard for Premium subscribers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses **React with TypeScript** built on **Vite** for fast development and bundling. The UI is constructed with **shadcn/ui components** built on **Radix UI primitives** and styled with **TailwindCSS**. State management is handled through **TanStack Query (React Query)** for server state and local React state for component-level data. The application uses **Wouter** for client-side routing and implements a responsive, mobile-first design approach.

### Backend Architecture
The backend is built with **Express.js and TypeScript** following a modular architecture. The server handles API routes, authentication middleware, file uploads via **multer**, and external service integrations. Database operations are abstracted through a storage interface pattern, allowing for easy testing and potential database switching. The backend implements rate limiting middleware and comprehensive error handling throughout the request pipeline.

### Database Layer
The application uses **Drizzle ORM** with **PostgreSQL** as the primary database through **Neon Database serverless**. The schema includes tables for users, CV uploads, analysis results, payments, usage statistics, and session storage. Database migrations are managed through Drizzle Kit, and the schema is shared between frontend and backend via a shared module structure.

### Authentication System
User authentication is implemented using **email/password authentication** with **Passport.js Local Strategy**. Passwords are securely hashed using **bcryptjs**. Sessions are stored in PostgreSQL using **connect-pg-simple** with a 7-day TTL. The system includes a developer account (username: "developer", password: "NewDev2024!") with full premium access until 2030 for testing and development purposes.

### File Processing Pipeline
CV files are uploaded via multipart form data and processed through a **PDF text extraction service** using **pdf-parse**. The extracted text undergoes validation and cleaning before being stored. The system supports PDF, DOC, and DOCX formats with a 10MB file size limit.

### AI Integration
The application integrates with **OpenRouter API** to access multiple AI models, primarily **Qwen 2.5 72B Instruct** (free tier). AI services include CV optimization, ATS compatibility checking, recruiter feedback generation, cover letter creation, and interview question generation. Each service has specific prompts tailored for its purpose and optimized for the Qwen model's capabilities.

### Payment System
**Stripe** integration handles both one-time payments (Basic plan) and recurring subscriptions (Premium plan). The system includes webhook handling for payment confirmation, subscription management, and automatic user plan updates. Payment records are stored locally for audit and user access tracking.

### Rate Limiting and Security
Custom rate limiting middleware protects API endpoints from abuse. The system implements CORS policies, secure session handling, and input validation throughout. File uploads include type and size restrictions for security.

## External Dependencies

- **Neon Database** - Serverless PostgreSQL hosting
- **OpenRouter** - AI model access and chat completions
- **Stripe** - Payment processing for Basic and Premium plans
- **passport-local** - Email/password authentication strategy
- **pdf-parse** - PDF text extraction library
- **shadcn/ui** - React component library built on Radix UI
- **TailwindCSS** - Utility-first CSS framework
- **Drizzle ORM** - TypeScript ORM for PostgreSQL

## Setup Instructions for Replit Import

### Required Environment Variables
When importing to Replit, set these secrets in the Secrets tab:
```
DATABASE_URL=<neon_database_connection_string>
OPENROUTER_API_KEY=<openrouter_api_key>
STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>
VITE_STRIPE_PUBLIC_KEY=<stripe_public_key>
SESSION_SECRET=<random_session_secret>
```

### Database Setup
1. Create a Neon Database account and get the connection string
2. Run `npm run db:push` to create database tables
3. The app will automatically create the developer account on first run

### Development Account
- **Username**: developer
- **Password**: NewDev2024!
- **Access**: Full premium features until 2030
- **Purpose**: Development and testing without payment setup

### AI Model Configuration
- **Default Model**: qwen/qwen-2.5-72b-instruct:free
- **Provider**: OpenRouter (free tier available)
- **Features**: CV optimization, ATS checking, recruiter feedback, cover letters

### File Structure
```
├── client/               # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── drizzle.config.ts    # Database configuration
└── replit.md           # Project documentation
```

### Running the Application
1. Import project to Replit
2. Set environment variables in Secrets tab
3. Run `npm install` (handled automatically)
4. Run `npm run db:push` to setup database
5. Start with the "Start application" workflow (`npm run dev`)

### Agent AI Continuation Instructions
This project is configured for AI agent continuation with:
- Complete type safety with TypeScript
- Shared schema between frontend/backend
- Modular architecture for easy extension
- Comprehensive documentation in replit.md
- Standard package.json structure
- All dependencies properly defined