# Safety Companion - Enterprise Edition

An advanced Enterprise Safety Companion platform that leverages cutting-edge AI and data analytics to transform workforce protection through intelligent, user-centric solutions.

## 🏗️ Key Features

### Core Safety Management
- **Interactive Safety Checklists** - Comprehensive safety assessments with photo uploads and severity tracking
- **Real-time AI Chat Assistant** - Google Gemini-powered safety guidance with voice input and file attachments
- **Risk Assessment Tools** - Job Hazard Analysis (JHA) forms with intelligent AI analysis
- **Safety Reporting System** - Incident tracking with predictive cost impact analysis
- **Training Video Library** - YouTube integration with completion tracking and analytics

### Advanced Analytics & Intelligence
- **Big Picture Pattern Analysis** - Multi-timeframe safety trend identification (monthly/quarterly/annual)
- **Insurance Actuarial Integration** - Premium risk calculations and claims likelihood projections
- **Behavioral Risk Analytics** - AI-powered employee safety behavior pattern detection
- **Executive Dashboards** - Real-time safety metrics for C-level decision making
- **Data Export Capabilities** - JSON exports for insurance companies and regulatory compliance

### Enterprise Features
- **Role-Based Authentication** - Field workers, supervisors, project managers, safety managers, admins
- **Multi-Tenant Support** - Company and project-based data isolation
- **Database Health Monitoring** - Real-time connection testing and performance metrics
- **Comprehensive Audit Trails** - Full activity logging for compliance and security
- **Mobile-Optimized Interface** - Touch-friendly design for tablet and phone use

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd safety-companion
npm install
```

2. **Database Setup:**
```bash
# Copy environment template
cp .env.example .env

# Configure your database URL and API keys in .env
# DATABASE_URL=postgresql://user:password@host:port/database
# GEMINI_API_KEY=your_gemini_api_key

# Push database schema
npm run db:push
```

3. **Start the application:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Demo Credentials
```
Email: demo@safecomp.com
Password: demo123
Role: Project Manager
```

## 🏛️ Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with dark theme optimized for construction environments  
- **Framer Motion** for smooth animations and interactive elements
- **Radix UI + shadcn/ui** for accessible, professional components
- **React Router** for client-side navigation with private route protection

### Backend Architecture
- **Node.js + Express** with TypeScript for full-stack type safety
- **Drizzle ORM** for type-safe database operations and migrations
- **PostgreSQL** with advanced indexing optimized for scalable construction operations
- **Session-based Authentication** with PostgreSQL session storage
- **Google Gemini AI** integration for intelligent safety analysis

### Security Features
- **Row Level Security (RLS)** policies for multi-tenant data isolation
- **Input validation** on all endpoints with express-validator
- **Rate limiting** and CORS protection
- **Account lockout** after failed login attempts
- **Secure password hashing** with bcrypt

## 📊 Pattern Analysis System

The centerpiece feature allows organizations to analyze months or years of safety data:

### Analysis Types
- **Daily Safety Checklists** - Pre-work inspections and equipment checks
- **Weekly Safety Audits** - System-specific safety reviews (electrical, mechanical, etc.)
- **Monthly Safety Reviews** - Equipment maintenance and compliance assessments
- **Quarterly Assessments** - Comprehensive facility and process evaluations  
- **Annual Inspections** - Full fleet and infrastructure safety analysis

### AI-Powered Insights
- **Risk Trend Analysis** - Identify improving, stable, or declining safety patterns
- **Behavioral Pattern Detection** - Spot concerning employee safety behaviors
- **Compliance Scoring** - OSHA compliance tracking and gap identification
- **Predictive Analytics** - Forecast potential incidents and maintenance needs
- **Insurance Optimization** - Premium risk factor calculations and cost projections

### Executive Reporting
- **Executive Summaries** - AI-generated reports for C-level stakeholders
- **Actuarial Data Export** - JSON exports for insurance underwriters
- **ROI Projections** - Cost-benefit analysis of safety investments
- **Department Risk Profiling** - Targeted safety interventions by team/location

## 🎯 Deployment

### Production Ready Features
- **Netlify Integration** - Optimized for serverless deployment
- **Environment Configuration** - Secure secret management
- **TypeScript Compliance** - Zero type errors for production stability
- **Performance Optimization** - Sub-100ms query targets with strategic indexing
- **Content Security Policy** - Hardened security headers for production

### Development vs Production
- **Development**: Full feature access with demo data
- **Production**: Clean slate ready for real company data
- **Migration Path**: Seamless upgrade from development to production environment

## 📁 Project Structure

```
safety-companion/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── contexts/        # React context providers
│   │   └── lib/            # Utilities and configurations
├── server/                   # Express backend
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database abstraction layer
│   └── services/           # Business logic services
├── shared/                  # Shared TypeScript schemas
│   └── schema.ts           # Drizzle database schema
├── scripts/                # Database and utility scripts
└── supabase/               # Migration files and configurations
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio for database management

# Production
npm run build           # Build for production
npm run start           # Start production server
```

## 🔑 Environment Variables

Required environment variables for full functionality:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# Security
SESSION_SECRET=your_secure_session_secret

# Optional Configuration
CORS_ORIGIN=http://localhost:3000
API_RATE_LIMIT=100
LOG_LEVEL=info
```

## 📈 Recent Achievements

### ✅ Pattern Analysis System
- **Big Picture Analytics** - Multi-select historical record analysis
- **Google Gemini Integration** - Advanced AI pattern recognition
- **Insurance Data Export** - Actuarial projections and risk assessments
- **Executive Summaries** - C-level reporting with financial impact analysis

### ✅ Database & Performance
- **Schema Optimization** - Added insurance analytics columns to analysis_history table
- **Strategic Indexing** - Performance optimization for mid-sized construction operations
- **Data Integrity** - Comprehensive validation and error handling
- **Real-time Analytics** - Sub-100ms query response times

### ✅ Authentication & Security
- **Production-Ready Auth** - Session-based authentication with PostgreSQL storage
- **Role-Based Access** - Multi-tier user permissions (field_worker to admin)
- **Account Security** - Login attempt tracking and account lockout protection
- **Input Validation** - Comprehensive request validation with express-validator

### ✅ Enterprise Integration
- **YouTube Analytics** - Training video completion tracking with timestamps
- **Multi-timeframe Analysis** - Monthly, quarterly, and annual safety trend analysis
- **Checklist Integration** - Daily, weekly, monthly, quarterly, and annual assessment support
- **Export Capabilities** - JSON data export for insurance and regulatory compliance

## 🎓 How to Use Pattern Analysis

1. **Navigate to History** → Click "Big Picture Pattern Analysis"
2. **Select Records** - Use checkboxes to choose multiple safety assessments
3. **Choose Timeframe** - Select monthly, quarterly, or annual analysis
4. **Generate Analysis** - Click "Analyze X Records" for comprehensive insights
5. **Export Data** - Download JSON reports for insurance companies

## 🤝 Contributing

This is an enterprise safety management platform designed for construction and industrial environments. The codebase prioritizes:

- **Type Safety** - Full TypeScript coverage across frontend and backend
- **Performance** - Optimized for large-scale deployments with strategic indexing
- **Security** - Enterprise-grade data protection with RLS policies
- **Accessibility** - WCAG compliant interface design for all users
- **Mobile-First** - Touch-optimized interface for field operations

## 📋 License

Proprietary enterprise software. Contact for licensing information.

## 🆘 Support

For technical support, deployment assistance, or feature requests, please contact the development team.

---

**Built for mid-sized construction professionals seeking competitive advantage through comprehensive safety management, AI-powered risk analysis, and insurance optimization that scales up or down with your operation.**