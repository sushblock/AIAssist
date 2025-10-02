import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "solo", "chambers", "firm"
  bcisafeMode: boolean("bci_safe_mode").default(true),
  state: text("state"),
  gstNumber: text("gst_number"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // "owner", "partner", "associate", "clerk", "client"
  barCouncilId: text("bar_council_id"),
  phone: text("phone"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matters table
export const matters = pgTable("matters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  caseNo: text("case_no").notNull(),
  filingNo: text("filing_no"),
  title: text("title").notNull(),
  court: text("court").notNull(),
  forum: text("forum").notNull(),
  judge: text("judge"),
  subject: text("subject"),
  stage: text("stage").notNull(),
  status: text("status").notNull().default("active"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  leadCounselId: uuid("lead_counsel_id").references(() => users.id),
  cnrNumber: text("cnr_number"),
  tags: text("tags").array(),
  nextHearingDate: timestamp("next_hearing_date"),
  filingDate: timestamp("filing_date"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parties table
export const parties = pgTable("parties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  name: text("name").notNull(),
  role: text("role").notNull(), // "petitioner", "respondent", "appellant", "intervener"
  type: text("type").notNull(), // "client", "opposing", "witness", "advocate"
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  state: text("state"),
  panNumber: text("pan_number"),
  aadharNumber: text("aadhar_number"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hearings table
export const hearings = pgTable("hearings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  date: timestamp("date").notNull(),
  time: text("time"),
  court: text("court").notNull(),
  judge: text("judge"),
  bench: text("bench"),
  purpose: text("purpose").notNull(),
  result: text("result"),
  nextDate: timestamp("next_date"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dockets table (for court orders, cause lists, etc.)
export const dockets = pgTable("dockets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  type: text("type").notNull(), // "order", "causelist", "notice", "judgment"
  title: text("title").notNull(),
  content: text("content"),
  date: timestamp("date").notNull(),
  source: text("source"), // "ecourts", "manual", "ai_extracted"
  fileUrl: text("file_url"),
  metadata: jsonb("metadata"),
  aiSummary: text("ai_summary"),
  extractedDates: jsonb("extracted_dates"),
  extractedActions: jsonb("extracted_actions"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  hearingId: uuid("hearing_id").references(() => hearings.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 50 }).default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  userId: uuid("user_id").references(() => users.id),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  rate: decimal("rate", { precision: 10, scale: 2 }),
  isBillable: boolean("is_billable").default(true),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  userId: uuid("user_id").references(() => users.id),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  receipt: text("receipt_url"),
  date: timestamp("date").notNull(),
  isBillable: boolean("is_billable").default(true),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: uuid("client_id").references(() => parties.id),
  matterId: uuid("matter_id").references(() => matters.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft"), // "draft", "sent", "paid", "overdue"
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  gstNumber: text("gst_number"),
  lineItems: jsonb("line_items"),
  pdfUrl: text("pdf_url"),
  paymentLink: text("payment_link"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // "court_alert", "deadline", "hearing_reminder", "payment_due"
  title: text("title").notNull(),
  message: text("message").notNull(),
  channel: text("channel").notNull(), // "app", "email", "sms", "whatsapp"
  status: varchar("status", { length: 50 }).default("pending"), // "pending", "sent", "delivered", "failed"
  readAt: timestamp("read_at"),
  payload: jsonb("payload"),
  scheduledFor: timestamp("scheduled_for"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  hash: text("hash").notNull(),
  storagePath: text("storage_path").notNull(),
  source: text("source").default("upload"), // "upload", "ecourts", "ai_generated"
  category: text("category"), // "petition", "order", "affidavit", "evidence"
  aiAnalysis: jsonb("ai_analysis"),
  chainOfCustody: jsonb("chain_of_custody"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Court alerts table
export const courtAlerts = pgTable("court_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  type: text("type").notNull(), // "hearing_scheduled", "order_uploaded", "deadline_approaching", "causelist_updated"
  title: text("title").notNull(),
  message: text("message").notNull(),
  urgency: varchar("urgency", { length: 20 }).default("medium"), // "low", "medium", "high", "critical"
  source: text("source").notNull(), // "ecourts", "manual", "ai_detected"
  actionRequired: boolean("action_required").default(false),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Analysis results table
export const aiAnalysisResults = pgTable("ai_analysis_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => organizations.id),
  matterId: uuid("matter_id").references(() => matters.id),
  fileId: uuid("file_id").references(() => files.id),
  type: text("type").notNull(), // "document_analysis", "case_summary", "deadline_extraction", "action_items"
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  extractedData: jsonb("extracted_data"),
  model: text("model").notNull(), // "gemini-2.5-flash", "gemini-2.5-pro"
  tokensUsed: integer("tokens_used"),
  processingTime: integer("processing_time"), // in milliseconds
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatterSchema = createInsertSchema(matters).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertPartySchema = createInsertSchema(parties).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertHearingSchema = createInsertSchema(hearings).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertDocketSchema = createInsertSchema(dockets).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true, isDeleted: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, isDeleted: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertCourtAlertSchema = createInsertSchema(courtAlerts).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true });
export const insertAiAnalysisResultSchema = createInsertSchema(aiAnalysisResults).omit({ id: true, createdAt: true });

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Matter = typeof matters.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type Hearing = typeof hearings.$inferSelect;
export type Docket = typeof dockets.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type File = typeof files.$inferSelect;
export type CourtAlert = typeof courtAlerts.$inferSelect;
export type AiAnalysisResult = typeof aiAnalysisResults.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMatter = z.infer<typeof insertMatterSchema>;
export type InsertParty = z.infer<typeof insertPartySchema>;
export type InsertHearing = z.infer<typeof insertHearingSchema>;
export type InsertDocket = z.infer<typeof insertDocketSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertCourtAlert = z.infer<typeof insertCourtAlertSchema>;
export type InsertAiAnalysisResult = z.infer<typeof insertAiAnalysisResultSchema>;
