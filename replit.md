# Overview

This is a comprehensive legal practice management system designed for Indian advocates and law firms. The application provides case management, court hearing tracking, document management, billing, and AI-powered document analysis capabilities. It integrates with eCourts India services for real-time case updates and uses local AI (Ollama) for intelligent document processing and insights generation.

The system is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and real-time court data integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Libraries:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management with automatic caching and refetching

**UI System:**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theme customization (light/dark mode support)
- Responsive design with mobile-first breakpoints

**State Management:**
- Zustand for client-side application state (sidebar, preferences, notifications)
- React Query for server state with optimistic updates
- Local storage persistence for user preferences

**Design Patterns:**
- Component composition with reusable UI primitives
- Hook-based logic extraction for reusability
- Path aliases (@/, @shared/, @assets/) for clean imports
- Feature-based folder organization

## Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js for the REST API server
- TypeScript with ESM modules for modern JavaScript features
- tsx for development with hot reload

**API Design:**
- RESTful endpoints following resource-based patterns
- JSON request/response format
- Centralized error handling and logging middleware
- Request/response logging for API monitoring

**Database Layer:**
- PostgreSQL as the primary relational database
- Drizzle ORM for type-safe database queries and schema management
- Neon serverless PostgreSQL adapter for connection pooling
- Migration system using drizzle-kit for schema versioning

**Data Model:**
The schema includes comprehensive legal practice entities:
- Organizations (multi-tenancy support for solo, chambers, firm)
- Users with role-based access (owner, partner, associate, clerk, client)
- Matters (cases) with CNR integration and court details
- Parties (clients, opposing counsel, witnesses, advocates)
- Hearings with date/time tracking
- Dockets for case proceedings
- Tasks with assignments and due dates
- Time entries for billing
- Expenses and Invoices for financial management
- Files/Documents with category organization
- Court Alerts for automated notifications
- AI Analysis Results storage

**Service Layer Architecture:**
- Separated business logic into dedicated services
- ECourtService for eCourts API integration
- AIAgentService with OllamaService for AI-powered analysis
- DbStorage class implementing IStorage with full PostgreSQL persistence using Drizzle ORM

## External Dependencies

**AI & Machine Learning:**
- Ollama (local AI) for document analysis, case summarization, and smart search
- Agentic workflow design for multi-step AI operations
- Uses llama3.1 model running on localhost:11434
- AI capabilities: document classification, date extraction, action item identification, urgency assessment
- Note: Requires Ollama installed locally with llama3.1 model pulled

**Court Integration:**
- eCourts India API (eciapi.akshit.me) for case data retrieval
- CNR (Case Number Reference) based case lookup
- Cause list fetching for daily hearing schedules
- Court order retrieval and tracking
- Real-time alert generation for case updates

**Database:**
- Neon serverless PostgreSQL for production database hosting
- PostgreSQL-specific features (UUID, JSONB, arrays)
- Connection pooling for efficient resource usage

**Development Tools:**
- Replit-specific plugins for runtime error overlay and dev tooling
- ESBuild for production bundling with tree-shaking
- Drizzle Kit for database migrations and schema push

**Session Management:**
- connect-pg-simple for PostgreSQL-backed session storage
- Express session middleware for user authentication

**Form Handling:**
- React Hook Form with Zod resolver for type-safe form validation
- Zod schemas derived from Drizzle schema for consistency
- Client-side validation with server-side schema enforcement

**Date & Time:**
- date-fns for date manipulation and formatting
- IST (Indian Standard Time) timezone handling
- Relative date formatting for user-friendly displays

**Key Architectural Decisions:**

1. **Local AI Processing**: Uses Ollama running locally instead of cloud AI services for data privacy and BCI compliance considerations, with fallback to Google GenAI

2. **Multi-tenancy**: Organization-based data isolation with org_id foreign keys throughout the schema

3. **Real-time Updates**: Polling-based refetch intervals (30s-60s) for court alerts and hearings rather than WebSockets for simplicity

4. **Type Safety**: End-to-end TypeScript with shared schema definitions between client and server using Zod and Drizzle

5. **Progressive Enhancement**: Mobile-responsive design with sidebar drawer on small screens, full sidebar on desktop

6. **BCI Safe Mode**: Configurable mode to ensure Bar Council of India compliance for professional conduct rules