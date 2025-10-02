# Overview

This is a comprehensive legal practice management system designed for Indian advocates and law firms. The application provides case management, court hearing tracking, document management, billing, and AI-powered document analysis capabilities. It integrates with eCourts India services for real-time case updates and uses local AI (Ollama) for intelligent document processing and insights generation.

The system is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and real-time court data integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## October 2025 - Billing & Financial Management Complete
- **PostgreSQL Migration**: Fully migrated from MemStorage to PostgreSQL with Drizzle ORM, all data persists across restarts
- **Time Tracking**: Manual time entry form and timer functionality with start/stop/pause, billable/non-billable tracking
- **Expense Recording**: Expense creation with categories (Court Fees, Travel, Printing, Postage, Consultation, Other), receipt tracking
- **GST-Compliant Invoicing**: Indian GST-compliant invoice generation with:
  - Matter-specific line item selection (time entries + expenses)
  - Automatic GST calculation: CGST (9%) + SGST (9%) for same state, IGST (18%) for different states
  - Auto-generated invoice numbers (INV-YYYY-MM-####)
  - Invoice status tracking (draft/sent/paid/overdue)
- **Schema Enhancements**: Added state and gstNumber fields to organizations and parties for GST compliance

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
- Organizations (multi-tenancy support for solo, chambers, firm) with state and gstNumber for GST compliance
- Users with role-based access (owner, partner, associate, clerk, client)
- Matters (cases) with CNR integration and court details
- Parties (clients, opposing counsel, witnesses, advocates) with state field for GST calculations
- Hearings with date/time tracking
- Dockets for case proceedings
- Tasks with assignments and due dates
- Time entries for billing with rate, duration, and billable flag
- Expenses with categories, amounts, tax, and billable tracking
- Invoices with GST-compliant calculations, line items (JSONB array), status tracking, and due dates
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

## Billing & Financial Management

**Time Tracking:**
- Manual time entry form with matter selection, description, date/time, hourly rate, billable flag
- Built-in timer with start/stop/pause functionality for real-time tracking
- Automatic duration calculation from start/end times
- Integration with invoice generation for billable time

**Expense Recording:**
- Predefined expense categories: Court Fees, Travel, Printing, Postage, Consultation, Other
- Amount and tax/GST tracking with numeric validation
- Matter-specific expense assignment
- Billable/non-billable flag for client billing
- Receipt reference field for documentation

**GST-Compliant Invoicing:**
- **Indian GST Compliance**: Automatic tax calculation based on organization and client states
  - Same state: CGST (9%) + SGST (9%) = 18% total
  - Different state: IGST (18%)
- **Matter-Specific Billing**: Fetches only selected matter's billable time entries and expenses
- **Line Items**: Stored as JSONB array with type, description, date, amount for audit trail
- **Invoice Numbering**: Auto-generated format INV-YYYY-MM-#### (sequential per month)
- **Status Workflow**: Draft → Sent → Paid/Overdue with due date tracking
- **Organization GST Number**: Displayed on invoices for compliance

**Key Architectural Decisions:**

1. **Local AI Processing**: Uses Ollama running locally instead of cloud AI services for data privacy and BCI compliance considerations, with fallback to Google GenAI

2. **Multi-tenancy**: Organization-based data isolation with org_id foreign keys throughout the schema

3. **Real-time Updates**: Polling-based refetch intervals (30s-60s) for court alerts and hearings rather than WebSockets for simplicity

4. **Type Safety**: End-to-end TypeScript with shared schema definitions between client and server using Zod and Drizzle

5. **Progressive Enhancement**: Mobile-responsive design with sidebar drawer on small screens, full sidebar on desktop

6. **BCI Safe Mode**: Configurable mode to ensure Bar Council of India compliance for professional conduct rules

7. **GST Compliance**: State-based tax calculation ensures invoices meet Indian tax requirements, critical for legal practice billing

8. **Matter-Scoped Billing**: Query filters ensure lawyers only bill clients for work on their specific matters, preventing cross-matter billing errors (professional ethics requirement)