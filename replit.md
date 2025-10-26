# Overview

Safety Companion is a full-stack web platform for construction and workplace safety management. It provides AI-powered safety assistance, real-time chat, professional Job Hazard Analysis (JHA) with AI analysis using OSHA data, and an Emergency Action Plan (EAP) Generator. The platform also includes safety reporting, video training, interactive maps, and project management tools, aiming to be a comprehensive digital safety companion that enhances safety protocols and operational efficiency in industrial environments.

# User Preferences

Preferred communication style: Simple, everyday language.
Hosting Preference: Netlify for production deployment over Replit due to cost considerations - wants always-on hosting without monthly fees
UI Design: Professional, enterprise-grade styling with dark theme and blue/cyan gradients - Unified enterprise checklist system with photo uploads, severity sliders, and tablet-optimized components (44px touch targets)
Navigation: Profiles icon positioned at the end of navigation list
Code Organization: Checklist functionality separated from SDS chat - clean separation of concerns. Reports separated from checklist input page - checklist page handles data entry, Reports section displays analysis outputs
Checklist System: Simplified to single enterprise mode - removed dual-mode complexity, prioritized first 6 safety checklists for AI and railway integration
Database Health Monitoring: Available in Profile > Database tab with detailed connection testing and diagnostics - read-only for monitoring
Security: Enterprise-grade RLS policies, audit trails, secure file uploads with virus scanning
Profile System: Tabbed interface with personal info, certifications, safety records, and preferences
Database Setup: Optimized migration order (tables→RLS→indexes→triggers) with comprehensive testing
Performance: Strategic indexes optimized for mid-sized construction operations with sub-100ms query targets
Security Testing: Comprehensive RLS policy validation with role isolation verification

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router
- **Styling**: Tailwind CSS with dark theme
- **UI Components**: Radix UI primitives with shadcn/ui
- **Animation**: Framer Motion
- **State Management**: React Context API and React hooks
- **Build Tool**: Vite

## Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: Supabase Auth with Microsoft SSO (JWT verification)
- **API Design**: RESTful API with centralized error handling
- **File Structure**: Monorepo with shared schema

## Data Storage
- **Dual Database Architecture**:
  - **Supabase** (Primary): User data, profiles, analysis_history, agent_outputs, JHSA templates.
  - **NeonDB** (Reference Only): OSHA injury rates, industry benchmarks, safety intelligence (read-only knowledge pool).
- **Vector Database**: pgvector v0.8.0 for AI embeddings in Supabase.
- **Schema Definition**: Centralized in `/shared/schema.ts`.
- **Database Connections**: `db`/`supabaseDb` for user operations, `neonDb` for OSHA reference reads.

## Authentication and Authorization
- **Strategy**: Supabase Auth with Microsoft SSO (JWT-based).
- **Token Verification**: Backend verifies Supabase JWT tokens via middleware.
- **User Context**: `req.user` populated with Supabase user data (id, email, role).
- **Route Protection**: `requireAuth` middleware validates JWT before route access.
- **Role-Based Access**: Supports roles like admin, project_manager, field_worker, supervisor, safety_manager.

## AI & Data Intelligence
- **AI Embeddings**: 768-dimensional semantic vectors using pgvector and Google Gemini for contextual search.
- **Multi-Agent Pipelines**: For JHA and EAP generation, utilizing 4-agent parallel/sequential architectures with `gemini-2.5-flash` for tasks like data validation, risk assessment, incident prediction, and report synthesis. **Token limits massively increased** (Agent 1: 12K, Agents 2-3: 16K each) for comprehensive analysis without truncation.
- **Pattern Analysis**: Google Gemini-powered system for identifying safety trends and actuarial data.

## UI/UX Decisions
- **Enterprise-grade styling** with dark theme and blue/cyan gradients.
- **Unified enterprise checklist system** with photo uploads and severity sliders.
- **Tablet-optimized components** with 44px touch targets.
- **Login Screen**: Spinning skyscraper animation with glow effects.
- **Admin Panel**: Enterprise-grade command center with real-time safety metrics dashboard, professional card styling, and 30-second refresh rates.

## Feature Specifications
- **JHA Form**: Professional-grade with text inputs, file attachments, blueprint uploads, and AI analysis using OSHA data.
- **Structured Question System**: Production-quality question optimization framework that transforms vague inputs into specific, agent-friendly structured data with 5 core components (sub-fields, examples, photo hints, agent context, critical warnings). **ALL 20 STRUCTURED QUESTIONS COMPLETE (Q1-Q20)** with full localStorage hydration, TypeScript interfaces, production-ready safety validation, and architect approval. Includes auto-calculation logic for weight distribution, wind forces, and crew fatigue metrics. Emergency preparedness (Q17-Q18) and public safety sections (Q19-Q20) with OSHA 1926.760 compliance enforcement for ground-level protection.
- **Weather Input Module**: Heads-up display at the top of Environmental & Weather Conditions section allowing users to paste current weather data from the main page's weather module. Includes 6 input fields (temperature, wind speed, conditions, precipitation, visibility, humidity) with live summary display. Data sent to AI agents as `weatherInputOverride` for fail-safe validation against user-entered structured questions.
- **EAP Generator**: 4-agent sequential pipeline generating OSHA-compliant plans from simplified questionnaire input.
- **Chat System**: Enhanced conversational AI with grounding capabilities, voice input, and file attachments.
- **Admin Panel**: Functionality for adding employees, exporting data, and Google Analytics integration.
- **Signup Process**: Mandatory comprehensive form requiring all profile fields.
- **Agent Output Viewing System**: Real-time progress tracking and detailed inspection of agent reasoning chains.
- **Reports Section**: Dedicated interface for viewing analysis reports separate from checklist input. ChecklistForm shows completion banner with CTA to view report in Reports section. SafetyAnalysisReport component remains untouched and displays in ReportView page. Navigation: ToolBox Talks icon replaced with Reports (FileText icon) linking to /reports route.

## System Design Choices
- **Production-ready authentication system** with sessionStorage persistence and role-based signup.
- **Comprehensive security hardening**: Input validation, rate limiting, secure CORS, secure error handling.
- **Netlify deployment configuration** with serverless functions for cost-effective hosting.
- **Multi-agent enhancement**: Structured TypeScript outputs and OSHA-compliant analysis methodology for JHA agents.
- **Structured Question Framework**: Reusable component system (PhotoHints, AgentNote, CriticalWarning, StructuredField) enabling rapid question optimization across all JHA sections. Mobile-optimized with 44px touch targets, OSHA/ANSI compliance citations, and dynamic UI based on risk levels.

# External Dependencies

- **AI Services**: Google Gemini AI (analysis, chat, vector embeddings, pattern analysis)
- **Maps Integration**: Google Maps API
- **Video Platform**: YouTube Data API
- **Weather Data**: Open-Meteo API
- **Chemical Data**: PubChem API
- **UI Framework**: Radix UI and shadcn/ui