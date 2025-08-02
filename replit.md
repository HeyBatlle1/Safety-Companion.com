# Overview

This is a comprehensive Safety Companion application built as a full-stack web platform for construction and workplace safety management. The application provides AI-powered safety assistance, real-time chat support, SDS (Safety Data Sheet) analysis, safety reporting, video training resources, interactive maps, and project management tools. The homepage features stunning animated building graphics that serve as the visual centerpiece. It serves as a digital safety companion for field workers, project managers, and safety administrators in construction and industrial environments.

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Professional, enterprise-grade styling with dark theme and blue/cyan gradients
Navigation: Profiles icon positioned at the end of navigation list
Code Organization: Checklist functionality separated from SDS chat - clean separation of concerns
Security: Enterprise-grade RLS policies, audit trails, secure file uploads with virus scanning
Profile System: Tabbed interface with personal info, certifications, safety records, and preferences
Database Setup: Optimized migration order (tables→RLS→indexes→triggers) with comprehensive testing
Performance: Strategic indexes for 175+ employee scale with sub-100ms query targets
Security Testing: Comprehensive RLS policy validation with role isolation verification

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: React Router for client-side navigation and private route protection
- **Styling**: Tailwind CSS with custom design system and dark theme optimized for construction environments
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible interface
- **Animation**: Framer Motion for smooth transitions and interactive elements
- **State Management**: React Context API for authentication state and React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for type safety across the full stack
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Session Management**: express-session with PostgreSQL store for secure user sessions
- **Authentication**: Custom authentication system with bcrypt password hashing
- **API Design**: RESTful API structure with centralized error handling middleware
- **File Structure**: Monorepo structure with shared schema between client and server

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for schema management
- **Database Provider**: Neon Database for managed PostgreSQL hosting
- **Schema Definition**: Centralized schema in `/shared/schema.ts` for type consistency
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Local Storage**: Browser localStorage for offline functionality and user preferences
- **Session Storage**: PostgreSQL-backed sessions for secure authentication state

## Authentication and Authorization
- **Authentication Strategy**: Custom email/password authentication with session-based security
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Route Protection**: Private route components with authentication checks
- **Role-Based Access**: User roles (admin, project_manager, field_worker) with appropriate permissions
- **Security Headers**: CORS configuration and security middleware for API protection

## External Dependencies
- **AI Services**: Google Gemini AI for intelligent safety analysis and chat responses
- **Maps Integration**: Google Maps API for location services and route planning
- **Video Platform**: YouTube Data API for safety training video content
- **Weather Data**: Open-Meteo API for real-time weather information affecting site safety
- **Building Animations**: Framer Motion powered interactive building graphics as homepage centerpiece
- **Chemical Data**: PubChem API for Safety Data Sheet information and chemical analysis
- **UI Framework**: Radix UI and shadcn/ui for accessible component primitives
- **Development Tools**: Replit integration for cloud-based development environment