# LawMasters Database Setup Guide

This guide contains all database schemas and queries needed to set up the LawMasters PostgreSQL database.

## Prerequisites

- PostgreSQL 14+ installed locally OR Neon serverless PostgreSQL account
- Node.js 18+ installed
- npm or yarn package manager

## Quick Setup (Recommended)

The project uses **Drizzle ORM** which automatically creates all tables for you:

```bash
# 1. Install dependencies
npm install

# 2. Set up your .env file with DATABASE_URL
cp .env.sample .env
# Edit .env and add your PostgreSQL connection string

# 3. Push schema to database (creates all tables)
npm run db:push

# 4. Seed initial data (organization and user)
npm run dev
# Application will auto-seed on first run
```

## Database Schema

The database uses **UUID** for all primary keys and foreign keys for data integrity.

### Core Tables

#### 1. Organizations Table
Stores law firm/chambers information.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'solo', 'chambers', 'firm'
  bci_safe_mode BOOLEAN DEFAULT true,
  state TEXT,
  gst_number TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_name ON organizations(name);
```

#### 2. Users Table
Stores advocates, clerks, and client users.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'owner', 'partner', 'associate', 'clerk', 'client'
  bar_council_id TEXT,
  phone TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### 3. Matters Table
Stores legal cases/matters.

```sql
CREATE TABLE matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  case_no TEXT NOT NULL,
  filing_no TEXT,
  title TEXT NOT NULL,
  court TEXT NOT NULL,
  forum TEXT NOT NULL,
  judge TEXT,
  subject TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  lead_counsel_id UUID REFERENCES users(id),
  cnr_number TEXT,
  tags TEXT[],
  next_hearing_date TIMESTAMP,
  filing_date TIMESTAMP,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matters_org_id ON matters(org_id);
CREATE INDEX idx_matters_case_no ON matters(case_no);
CREATE INDEX idx_matters_status ON matters(status);
CREATE INDEX idx_matters_cnr ON matters(cnr_number);
```

#### 4. Parties Table
Stores clients, opposing counsel, witnesses.

```sql
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'petitioner', 'respondent', 'appellant', 'intervener'
  type TEXT NOT NULL, -- 'client', 'opposing', 'witness', 'advocate'
  email TEXT,
  phone TEXT,
  address TEXT,
  state TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parties_matter_id ON parties(matter_id);
CREATE INDEX idx_parties_org_id ON parties(org_id);
CREATE INDEX idx_parties_type ON parties(type);
```

#### 5. Hearings Table
Stores court hearing schedules.

```sql
CREATE TABLE hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  date TIMESTAMP NOT NULL,
  time TEXT,
  court TEXT NOT NULL,
  judge TEXT,
  bench TEXT,
  purpose TEXT NOT NULL,
  result TEXT,
  next_date TIMESTAMP,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hearings_matter_id ON hearings(matter_id);
CREATE INDEX idx_hearings_date ON hearings(date);
CREATE INDEX idx_hearings_org_id ON hearings(org_id);
```

#### 6. Tasks Table
Stores task assignments and deadlines.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  hearing_id UUID REFERENCES hearings(id),
  assignee_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Billing & Financial Tables

#### 7. Time Entries Table
Tracks billable and non-billable time.

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  user_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  rate DECIMAL(10, 2),
  is_billable BOOLEAN DEFAULT true,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_is_billable ON time_entries(is_billable);
```

#### 8. Expenses Table
Tracks case-related expenses.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  user_id UUID REFERENCES users(id),
  category TEXT NOT NULL, -- 'Court Fees', 'Travel', 'Printing', 'Postage', 'Consultation', 'Other'
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  receipt_url TEXT,
  date TIMESTAMP NOT NULL,
  is_billable BOOLEAN DEFAULT true,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_matter_id ON expenses(matter_id);
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_is_billable ON expenses(is_billable);
```

#### 9. Invoices Table
GST-compliant invoices for billing.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES parties(id),
  matter_id UUID REFERENCES matters(id),
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue'
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  gst_number TEXT,
  line_items JSONB, -- Array of time entries and expenses
  pdf_url TEXT,
  payment_link TEXT,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_matter_id ON invoices(matter_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
```

### Document Management Tables

#### 10. Files Table
Stores uploaded documents and files.

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  source TEXT DEFAULT 'upload', -- 'upload', 'ecourts', 'ai_generated'
  category TEXT, -- 'petition', 'order', 'affidavit', 'evidence'
  ai_analysis JSONB,
  chain_of_custody JSONB,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_matter_id ON files(matter_id);
CREATE INDEX idx_files_org_id ON files(org_id);
CREATE INDEX idx_files_hash ON files(hash);
```

#### 11. Dockets Table
Court orders, cause lists, notices.

```sql
CREATE TABLE dockets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  type TEXT NOT NULL, -- 'order', 'causelist', 'notice', 'judgment'
  title TEXT NOT NULL,
  content TEXT,
  date TIMESTAMP NOT NULL,
  source TEXT, -- 'ecourts', 'manual', 'ai_extracted'
  file_url TEXT,
  metadata JSONB,
  ai_summary TEXT,
  extracted_dates JSONB,
  extracted_actions JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dockets_matter_id ON dockets(matter_id);
CREATE INDEX idx_dockets_date ON dockets(date);
```

### Communication & Alerts Tables

#### 12. Notifications Table
User notifications and alerts.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'court_alert', 'deadline', 'hearing_reminder', 'payment_due'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'app', 'email', 'sms', 'whatsapp'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  read_at TIMESTAMP,
  payload JSONB,
  scheduled_for TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
```

#### 13. Court Alerts Table
Automated alerts from eCourts integration.

```sql
CREATE TABLE court_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  type TEXT NOT NULL, -- 'hearing_scheduled', 'order_uploaded', 'deadline_approaching', 'causelist_updated'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  source TEXT NOT NULL, -- 'ecourts', 'manual', 'ai_detected'
  action_required BOOLEAN DEFAULT false,
  due_date TIMESTAMP,
  resolved_at TIMESTAMP,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_court_alerts_matter_id ON court_alerts(matter_id);
CREATE INDEX idx_court_alerts_org_id ON court_alerts(org_id);
CREATE INDEX idx_court_alerts_urgency ON court_alerts(urgency);
```

### AI & Analytics Tables

#### 14. AI Analysis Results Table
Stores AI-powered document analysis results.

```sql
CREATE TABLE ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  matter_id UUID REFERENCES matters(id),
  file_id UUID REFERENCES files(id),
  type TEXT NOT NULL, -- 'document_analysis', 'case_summary', 'deadline_extraction', 'action_items'
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  confidence DECIMAL(5, 4),
  extracted_data JSONB,
  model TEXT NOT NULL, -- 'llama3.2' or 'gemini-2.5-flash'
  tokens_used INTEGER,
  processing_time INTEGER, -- in milliseconds
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_analysis_matter_id ON ai_analysis_results(matter_id);
CREATE INDEX idx_ai_analysis_file_id ON ai_analysis_results(file_id);
```

## Initial Seed Data

After creating tables, insert initial organization and user:

```sql
-- Create default organization
INSERT INTO organizations (name, type, state, gst_number, bci_safe_mode) 
VALUES (
  'Kumar & Associates',
  'chambers',
  'Delhi',
  '07AAAAA0000A1Z5',
  true
) RETURNING id;

-- Create default user (replace org_id with the UUID from above)
INSERT INTO users (org_id, username, email, name, role, bar_council_id)
VALUES (
  '<org_id_from_above>',
  'adv.kumar',
  'kumar@lawmasters.in',
  'Adv. Kumar',
  'owner',
  'D/1234/2020'
);
```

## Manual Database Setup (Alternative)

If you prefer to set up manually instead of using Drizzle:

```bash
# 1. Create database
createdb lawmasters

# 2. Connect to database
psql lawmasters

# 3. Copy and paste all CREATE TABLE statements above

# 4. Run seed data INSERT statements

# 5. Verify tables created
\dt
```

## Connection String Examples

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/lawmasters
```

### Neon (Serverless PostgreSQL)
```
postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/lawmasters?sslmode=require
```

### Heroku Postgres
```
postgres://username:password@host.compute.amazonaws.com:5432/database
```

## Database Migrations

This project uses **Drizzle Kit** for schema management:

```bash
# Push schema changes to database
npm run db:push

# Generate migration files (optional)
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

## Backup & Restore

### Backup
```bash
pg_dump -h localhost -U postgres lawmasters > backup.sql
```

### Restore
```bash
psql -h localhost -U postgres lawmasters < backup.sql
```

## Troubleshooting

### Connection Issues
```bash
# Test database connection
psql $DATABASE_URL

# Check if PostgreSQL is running
pg_isready
```

### Permission Issues
```sql
-- Grant all privileges to user
GRANT ALL PRIVILEGES ON DATABASE lawmasters TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
```

### Reset Database
```bash
# Drop and recreate
dropdb lawmasters
createdb lawmasters
npm run db:push
```

## Production Deployment

For production with Neon or other cloud PostgreSQL:

1. Create database on cloud provider
2. Copy connection string to `.env` as `DATABASE_URL`
3. Run `npm run db:push` to create tables
4. Application will auto-seed initial data on first run

## Security Notes

- Never commit `.env` file to version control
- Use SSL connections in production (`sslmode=require`)
- Rotate database credentials regularly
- Limit database user permissions to necessary operations only
- Enable row-level security for multi-tenant isolation (optional)

---

**Need Help?** Check the Drizzle ORM documentation: https://orm.drizzle.team/docs/overview
