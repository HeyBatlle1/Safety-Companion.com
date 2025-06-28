# Safety-Companion.com
# Safety Companion

AI-powered construction safety compliance platform for enterprise construction teams.

## Overview

Safety Companion is a comprehensive safety management platform designed for construction companies, safety managers, and field workers. The platform combines AI-powered risk assessment, real-time compliance tracking, and collaborative safety management tools to enhance workplace safety and regulatory compliance.

## Features

### 🔍 AI-Powered Safety Assessment
- Intelligent risk analysis using Google Gemini AI
- Multi-agent AI orchestration for comprehensive evaluations
- Automated safety recommendations and compliance suggestions
- Real-time hazard identification and mitigation strategies

### 📋 Digital Safety Checklists
- Industry-specific safety assessment templates
- OSHA compliance mapping with regulatory standards
- Photo documentation and evidence collection
- Progress tracking with completion analytics

### 🗺️ Location-Based Safety Management
- Google Maps integration for site identification
- Weather data integration for environmental risk assessment
- Site-specific safety protocols and procedures
- Geographic risk correlation and analysis

### 📐 Blueprint Management
- Professional drawing viewer with annotation tools
- Team collaboration on safety markups
- Version control for drawing revisions
- Export capabilities with safety annotations

### 💬 Safety Data Sheet (SDS) Assistant
- AI-powered chemical hazard communication
- Intelligent SDS analysis and recommendations
- Chemical safety protocol generation
- Regulatory compliance verification

### 👥 Enterprise User Management
- Role-based access control (Admin, Project Manager, Field Worker)
- Microsoft SSO integration
- Certification and training tracking
- Team collaboration and communication tools

## Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Supabase Auth with Microsoft SSO
- **AI Integration:** Google Gemini AI, Multi-agent orchestration
- **Maps:** Google Maps JavaScript API
- **Build Tool:** Vite
- **Deployment:** Netlify

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Supabase account
- Google Cloud Platform account (for Gemini AI and Maps)
- Microsoft Azure account (for SSO)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Services
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Microsoft SSO
VITE_MICROSOFT_CLIENT_ID=your_microsoft_app_client_id

# External Integrations
VITE_BOLT_MULTI_AGENT_URL=your_bolt_agent_url
VITE_BOLT_API_KEY=your_bolt_api_key
VITE_NEWSDATA_API_KEY=your_newsdata_api_key
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HeyBatlle1/Safety-Companion.com.git
   cd Safety-Companion.com
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and configuration
   ```

4. **Set up Supabase database:**
   - Run the migration file: `supabase/migrations/20250627220727_lucky_dawn.sql`
   - Execute in Supabase Dashboard → SQL Editor or use Supabase CLI:
   ```bash
   supabase db push
   ```

5. **Configure Microsoft SSO:**
   - Create app registration in Azure Portal
   - Set redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
   - Configure in Supabase Dashboard → Authentication → Providers → Microsoft

6. **Start development server:**
   ```bash
   npm run dev
   ```

## Database Setup

The application requires the following Supabase tables:
- `user_profiles` - User profile and role management
- `safety_reports` - Safety assessment data
- `chat_messages` - AI conversation history
- `analysis_history` - AI analysis records
- `drug_screens_enhanced` - Certification tracking
- `notification_preferences` - User notification settings

All tables include Row Level Security (RLS) policies for data protection.

## User Roles

### Admin
- Full platform access
- User role management
- System configuration
- All safety data access

### Project Manager
- Team member data access
- Project-specific safety oversight
- Checklist assignment and review
- Compliance reporting

### Field Worker
- Personal profile management
- Safety checklist completion
- AI safety assistant access
- Incident reporting

## Deployment

### Netlify Deployment

1. **Connect repository to Netlify**
2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set environment variables in Netlify dashboard**
4. **Configure custom domain (optional)**

### Production Considerations

- Enable Supabase production mode
- Configure proper CORS settings
- Set up monitoring and alerting
- Enable backup strategies
- Configure CDN for static assets

## Development

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Structure
```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── services/       # API and business logic
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── layouts/        # Layout components
└── routes/         # Routing configuration
```

## Contributing

This is proprietary software developed for enterprise construction safety management. For feature requests or support, please contact the development team.

## Support

For technical support or questions about implementation, please refer to the internal documentation or contact the system administrator.

## License

All rights reserved. This software is proprietary and confidential.

---

**Safety Companion** - Professional construction safety management with AI buiilt in Real Time Data
