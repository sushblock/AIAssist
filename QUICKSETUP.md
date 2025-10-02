# LawMasters - Quick Setup Guide

Get your LawMasters legal practice management system up and running in minutes!

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** OR **Neon account** - [Get Neon free](https://neon.tech/)
- **Git** - For cloning the repository
- **(Optional) Ollama** - For local AI features

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd lawmasters

# Install dependencies
npm install
```

### Step 2: Database Setup

#### Option A: Using Neon (Recommended - Easiest)

1. Create a free account at [neon.tech](https://neon.tech/)
2. Create a new project called "lawmasters"
3. Copy your connection string (looks like: `postgresql://username:password@ep-xxx.neon.tech/lawmasters?sslmode=require`)

#### Option B: Local PostgreSQL

```bash
# Create database
createdb lawmasters

# Your connection string will be:
postgresql://postgres:your_password@localhost:5432/lawmasters
```

### Step 3: Configure Environment

```bash
# Copy the environment template
cp .env.sample .env

# Open .env in your editor
nano .env  # or use your preferred editor
```

**Minimum required configuration:**

```env
# Add your database connection string
DATABASE_URL=postgresql://your_connection_string_here

# Generate a random secret (or use: openssl rand -base64 32)
SESSION_SECRET=your_random_secret_key_here
```

### Step 4: Create Database Tables

```bash
# Push schema to database (creates all tables)
npm run db:push
```

You should see:
```
✓ Pushing schema to database...
✓ Done!
```

### Step 5: Start the Application

```bash
# Start development server
npm run dev
```

You should see:
```
Server running on port 5000
Database connected successfully
```

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

🎉 **You're all set!** The application will automatically create:
- Default organization: "Kumar & Associates"
- Default user: "adv.kumar"

---

## 🤖 Optional: Enable AI Features

LawMasters uses **Ollama** for local AI processing (document analysis, case summaries, insights).

### Install Ollama

1. **Download Ollama:**
   - Visit [ollama.ai](https://ollama.ai)
   - Download for your OS (Windows/Mac/Linux)
   - Install and run

2. **Pull the AI Model:**
   ```bash
   ollama pull llama3.2
   ```

3. **Verify Ollama is Running:**
   ```bash
   ollama list
   # Should show llama3.2
   ```

4. **Update .env (already configured by default):**
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

5. **Restart your application:**
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

**AI features now enabled:**
- 📄 Document analysis
- 📊 Dashboard insights
- 🔍 Smart search
- 📝 Case summaries

---

## 🔧 Configuration Reference

### Essential Variables (Required)

```env
DATABASE_URL=postgresql://...     # PostgreSQL connection
SESSION_SECRET=random_string      # Session encryption key
```

### Optional Variables

```env
PORT=5000                         # Server port (default: 5000)
NODE_ENV=development              # Environment
OLLAMA_BASE_URL=http://localhost:11434  # Ollama AI
OLLAMA_MODEL=llama3.2            # AI model
GEMINI_API_KEY=xxx               # Fallback AI (optional)
BCI_SAFE_MODE=true               # Bar Council compliance
```

---

## 📁 Project Structure

```
lawmasters/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # UI components
│   │   └── lib/        # Utilities
├── server/              # Express backend
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database operations
│   └── services/       # Business logic
├── shared/              # Shared types & schemas
│   └── schema.ts       # Database schema
├── .env                 # Your configuration (create this)
├── .env.sample          # Template
└── package.json         # Dependencies
```

---

## 🎯 What's Working Out of the Box

After setup, you can immediately use:

✅ **Matter Management** - Create and track legal cases  
✅ **Parties Management** - Manage clients, opposing counsel  
✅ **Hearings & Calendar** - Schedule court dates  
✅ **Tasks & Deadlines** - Track work items  
✅ **Time Tracking** - Log billable hours (with timer)  
✅ **Expense Recording** - Track case expenses  
✅ **GST Invoicing** - Generate compliant invoices  
✅ **Dashboard** - Overview of cases and deadlines  
✅ **Court Alerts** - eCourts India integration  

### With Ollama Installed:
✅ **AI Document Analysis** - Extract key information  
✅ **Smart Insights** - AI-powered recommendations  
✅ **Case Summaries** - Automatic case overviews  

---

## 🐛 Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**
```bash
# Make sure .env file exists
ls -la .env

# Check if DATABASE_URL is set
cat .env | grep DATABASE_URL

# If missing, add it:
echo "DATABASE_URL=postgresql://..." >> .env
```

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Test database connection
psql $DATABASE_URL

# For Neon, make sure you have ?sslmode=require at the end
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Option 1: Kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Option 2: Use a different port
# Add to .env:
PORT=3000
```

### Issue: "npm run dev" fails

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try again
npm run dev
```

### Issue: Ollama not working

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434

# If not, start Ollama
ollama serve

# Pull the model again
ollama pull llama3.2

# Restart your app
npm run dev
```

### Issue: Tables not created

**Solution:**
```bash
# Force push schema
npm run db:push -- --force

# If that fails, check DATABASE_SETUP.md for manual setup
```

---

## 📚 Next Steps

1. **Customize Your Organization:**
   - Go to Settings (coming soon)
   - Update organization name, GST number, state

2. **Add Your First Matter:**
   - Navigate to "Matters"
   - Click "New Matter"
   - Fill in case details

3. **Track Time:**
   - Go to "Billing"
   - Use timer or manual entry
   - Mark as billable

4. **Generate Invoice:**
   - Go to "Billing"
   - Click "New Invoice"
   - Select matter and line items

5. **Explore AI Features** (if Ollama installed):
   - Upload documents
   - View AI analysis
   - Check dashboard insights

---

## 🔒 Security Notes

- Never commit `.env` to version control (already in .gitignore)
- Use strong SESSION_SECRET (generate with: `openssl rand -base64 32`)
- In production, use SSL/TLS for database connections
- Keep dependencies updated: `npm audit fix`

---

## 🚀 Deployment to Production

### Option 1: Deploy to Replit

1. Push code to GitHub
2. Import to Replit
3. Replit auto-detects configuration
4. Click "Deploy" button
5. Your app is live!

### Option 2: Deploy to Any Platform

```bash
# Build for production
npm run build

# Set environment variables on your platform
DATABASE_URL=your_production_db
SESSION_SECRET=your_production_secret
NODE_ENV=production

# Start production server
npm start
```

**Compatible with:**
- Heroku
- Vercel
- Railway
- Render
- DigitalOcean
- AWS
- Azure

---

## 📞 Need Help?

### Documentation
- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed database info
- [Environment Variables](./.env.sample) - All config options

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:push          # Update database schema
npm run db:studio        # Open Drizzle Studio (DB GUI)

# Production
npm run build            # Build for production
npm start                # Start production server

# Maintenance
npm audit fix            # Fix security issues
npm outdated             # Check for updates
```

---

## ✨ Tips for Success

1. **Start Small** - Add one matter, track time, generate one invoice
2. **Use Timer** - The built-in timer is great for tracking billable hours
3. **Enable Ollama** - AI features save significant time
4. **Backup Regularly** - Export database periodically
5. **Keep Updated** - Pull latest changes regularly

---

**Congratulations!** 🎉 You're now running a complete legal practice management system.

Time to modernize your practice! 💼⚖️
