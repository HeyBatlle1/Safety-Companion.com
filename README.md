# Safety Companion - Enterprise Construction Safety Platform

A comprehensive Safety Companion application built as a full-stack web platform for construction and workplace safety management. The application provides AI-powered safety assistance, real-time chat support, SDS (Safety Data Sheet) analysis, safety reporting, video training resources, interactive maps, and project management tools.

## 🏗️ Key Features

### Core Safety Management
- **Job Hazard Analysis (JHA)** - Professional-grade forms with text inputs, file attachments, blueprint uploads, and intelligent AI analysis using real OSHA data integration
- **Enterprise Checklist System** - Unified checklist system with photo uploads, severity sliders, and tablet-optimized components (44px touch targets)
- **AI-Powered Risk Assessment** - Intelligent safety analysis and predictive safety analytics using Google Gemini AI
- **Safety Data Sheet (SDS) Analysis** - Chemical data integration with PubChem API for comprehensive safety information
- **Real-time Safety Alerts** - Comprehensive alert system for enterprise environments

### Weather & Environmental Monitoring
- **Real-time Weather Integration** - Accurate weather data using wttr.in API with US format (°F first, mph wind speeds)
- **Safety Weather Alerts** - Automated alerts for hazardous weather conditions affecting construction sites
- **Location-based Services** - Google Maps integration for site location and route planning

### Enterprise Features
- **Role-based Access Control** - User roles (admin, project_manager, field_worker, supervisor, safety_manager)
- **Database Health Monitoring** - Available in Profile > Database tab with detailed connection testing and diagnostics
- **Security Hardening** - Enterprise-grade RLS policies, audit trails, secure file uploads with virus scanning
- **Performance Optimization** - Strategic indexes for 175+ employee scale with sub-100ms query targets

### Training & Resources
- **Video Training Platform** - YouTube Data API integration for safety training content
- **Interactive Building Graphics** - Stunning animated building graphics as homepage centerpiece using Framer Motion
- **Mobile-optimized Interface** - Responsive design optimized for construction environments

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with custom design system and dark theme
- **Radix UI & shadcn/ui** for accessible component primitives
- **Framer Motion** for smooth animations
- **React Router** for client-side navigation
- **Vite** for fast development and optimized builds

### Backend
- **Node.js & Express.js** server framework
- **TypeScript** for full-stack type safety
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with Neon Database hosting
- **Custom Authentication** with bcrypt password hashing
- **RESTful API** with centralized error handling

### External Services
- **Google Gemini AI** - Intelligent safety analysis and chat responses
- **Google Maps API** - Location services and route planning
- **YouTube Data API** - Safety training video content
- **wttr.in API** - Real-time weather information
- **PubChem API** - Chemical data for SDS analysis

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon Database recommended)
- Required API keys (see Environment Variables section)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd safety-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and configure:
   ```env
   DATABASE_URL=your_neon_database_url
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_GOOGLE_API_KEY=your_google_maps_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio for database management

## 🌐 Deployment

### Netlify Deployment
The application is configured for Netlify deployment with automatic builds from the main branch.

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18+

### Environment Variables for Production
Ensure all required environment variables are set in your Netlify dashboard under Site Settings > Environment Variables.

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services and utilities
│   │   └── lib/          # Utility libraries
├── server/                # Backend Express application
│   ├── config/           # Server configuration
│   ├── middleware/       # Express middleware
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema (Drizzle)
└── supabase/            # Supabase configuration and migrations
```

## 🔐 Security Features

- **Row Level Security (RLS)** policies for data protection
- **Input validation** on all endpoints with Zod schemas
- **Rate limiting** for API protection
- **Secure CORS** configuration
- **Password hashing** with bcrypt
- **Session-based authentication** with PostgreSQL store
- **Audit trails** for compliance tracking

## 📊 Performance

- **Sub-100ms query targets** for database operations
- **Strategic indexing** for 175+ employee scale
- **Optimized builds** with Vite bundling
- **Responsive design** with mobile-first approach
- **Lazy loading** for improved initial load times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Recent Updates

### Weather System Enhancement
- ✅ Switched to wttr.in API for more accurate real-time temperature data
- ✅ Updated display format to US standards (°F first, mph for wind speeds)
- ✅ Enhanced weather widget with better error handling
- ✅ Added automatic refresh every 30 minutes

### Security & Performance
- ✅ Comprehensive security hardening completed
- ✅ Removed all console logs from production
- ✅ Implemented input validation on all endpoints
- ✅ Added rate limiting and secured CORS
- ✅ Fixed TypeScript errors and created secure error handling

### Database & Authentication
- ✅ Production-ready authentication system with sessionStorage persistence
- ✅ Role-based signup system (field_worker, supervisor, project_manager, safety_manager, admin)
- ✅ Comprehensive Supabase cleanup completed
- ✅ Optimized migration order with comprehensive testing

## 📞 Support

For enterprise support and customization inquiries, please contact the development team.

## 📄 License

This project is proprietary software developed for enterprise construction safety management.

---

**Built for 175+ employees at construction companies seeking competitive advantage through comprehensive safety management and compliance documentation.**