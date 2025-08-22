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
User authentication is implemented using **Replit's OpenID Connect (OIDC)** integration with **Passport.js**. Sessions are stored in PostgreSQL using **connect-pg-simple** with a 7-day TTL. The system supports automatic user creation and profile synchronization from the OIDC provider.

### File Processing Pipeline
CV files are uploaded via multipart form data and processed through a **PDF text extraction service** using **pdf-parse**. The extracted text undergoes validation and cleaning before being stored. The system supports PDF, DOC, and DOCX formats with a 10MB file size limit.

### AI Integration
The application integrates with **OpenRouter API** to access multiple AI models, primarily **Claude 3.5 Sonnet**. AI services include CV optimization, ATS compatibility checking, recruiter feedback generation, cover letter creation, and interview question generation. Each service has specific prompts tailored for its purpose.

### Payment System
**Stripe** integration handles both one-time payments (Basic plan) and recurring subscriptions (Premium plan). The system includes webhook handling for payment confirmation, subscription management, and automatic user plan updates. Payment records are stored locally for audit and user access tracking.

### Rate Limiting and Security
Custom rate limiting middleware protects API endpoints from abuse. The system implements CORS policies, secure session handling, and input validation throughout. File uploads include type and size restrictions for security.

## External Dependencies

- **Neon Database** - Serverless PostgreSQL hosting
- **OpenRouter** - AI model access and chat completions
- **Stripe** - Payment processing for Basic and Premium plans
- **Replit Auth** - OIDC authentication provider
- **pdf-parse** - PDF text extraction library
- **shadcn/ui** - React component library built on Radix UI
- **TailwindCSS** - Utility-first CSS framework
- **Drizzle ORM** - TypeScript ORM for PostgreSQL