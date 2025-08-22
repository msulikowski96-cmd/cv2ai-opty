# CV Optimizer Pro

Comprehensive AI-powered CV optimization application with payment processing and advanced analytics.

## Quick Start for Replit

1. **Import to Replit** - Fork or import this repository
2. **Set Environment Variables** in Secrets tab:
   ```
   DATABASE_URL=<neon_database_connection_string>
   OPENROUTER_API_KEY=<openrouter_api_key>  
   STRIPE_SECRET_KEY=<stripe_secret_key>
   STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>
   VITE_STRIPE_PUBLIC_KEY=<stripe_public_key>
   SESSION_SECRET=<random_session_secret>
   ```
3. **Setup Database** - Run `npm run db:push`
4. **Start Application** - Use "Start application" workflow or `npm run dev`

## Development Account
- **Email**: developer@cvoptimizer.local
- **Username**: developer  
- **Password**: NewDev2024!
- **Access**: Full premium features until 2030

## Features
- AI-powered CV optimization (Qwen 2.5 72B Instruct)
- ATS compatibility checking
- Recruiter feedback generation
- Cover letter creation
- Stripe payment integration
- Usage analytics
- File upload and processing

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript  
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js (email/password)
- AI: OpenRouter API
- Payments: Stripe

## Architecture
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared types and database schema
- `replit.md` - Complete project documentation

For detailed documentation, see `replit.md`.