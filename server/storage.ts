import { 
  type Organization, type InsertOrganization,
  type User, type InsertUser,
  type Matter, type InsertMatter,
  type Party, type InsertParty,
  type Hearing, type InsertHearing,
  type Docket, type InsertDocket,
  type Task, type InsertTask,
  type TimeEntry, type InsertTimeEntry,
  type Expense, type InsertExpense,
  type Invoice, type InsertInvoice,
  type Notification, type InsertNotification,
  type File, type InsertFile,
  type CourtAlert, type InsertCourtAlert,
  type AiAnalysisResult, type InsertAiAnalysisResult,
  organizations, users, matters, parties, hearings, dockets, 
  tasks, timeEntries, expenses, invoices, notifications, 
  files, courtAlerts, aiAnalysisResults
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, gte, lte, isNull, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByOrg(orgId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Matters
  getMatter(id: string): Promise<Matter | undefined>;
  getMattersByOrg(orgId: string, filters?: { status?: string; stage?: string }): Promise<Matter[]>;
  createMatter(matter: InsertMatter): Promise<Matter>;
  updateMatter(id: string, updates: Partial<Matter>): Promise<Matter | undefined>;
  deleteMatter(id: string): Promise<boolean>;

  // Parties
  getPartiesByMatter(matterId: string): Promise<Party[]>;
  getPartiesByOrg(orgId: string): Promise<Party[]>;
  createParty(party: InsertParty): Promise<Party>;
  updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined>;

  // Hearings
  getHearing(id: string): Promise<Hearing | undefined>;
  getHearingsByMatter(matterId: string): Promise<Hearing[]>;
  getHearingsByDateRange(orgId: string, startDate: Date, endDate: Date): Promise<Hearing[]>;
  getTodaysHearings(orgId: string): Promise<Hearing[]>;
  createHearing(hearing: InsertHearing): Promise<Hearing>;
  updateHearing(id: string, updates: Partial<Hearing>): Promise<Hearing | undefined>;

  // Dockets
  getDocketsByMatter(matterId: string): Promise<Docket[]>;
  createDocket(docket: InsertDocket): Promise<Docket>;

  // Tasks
  getTasksByMatter(matterId: string): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByOrg(orgId: string, filters?: { status?: string; priority?: string }): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;

  // Time Entries
  getTimeEntriesByMatter(matterId: string): Promise<TimeEntry[]>;
  getTimeEntriesByUser(userId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;

  // Expenses
  getExpensesByMatter(matterId: string): Promise<Expense[]>;
  getExpensesByOrg(orgId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Invoices
  getInvoicesByOrg(orgId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;

  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;

  // Files
  getFilesByMatter(matterId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;

  // Court Alerts
  getCourtAlertsByOrg(orgId: string): Promise<CourtAlert[]>;
  getCourtAlertsByMatter(matterId: string): Promise<CourtAlert[]>;
  createCourtAlert(alert: InsertCourtAlert): Promise<CourtAlert>;
  updateCourtAlert(id: string, updates: Partial<CourtAlert>): Promise<CourtAlert | undefined>;

  // AI Analysis
  getAiAnalysisResultsByMatter(matterId: string): Promise<AiAnalysisResult[]>;
  createAiAnalysisResult(result: InsertAiAnalysisResult): Promise<AiAnalysisResult>;
}

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization> = new Map();
  private users: Map<string, User> = new Map();
  private matters: Map<string, Matter> = new Map();
  private parties: Map<string, Party> = new Map();
  private hearings: Map<string, Hearing> = new Map();
  private dockets: Map<string, Docket> = new Map();
  private tasks: Map<string, Task> = new Map();
  private timeEntries: Map<string, TimeEntry> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private files: Map<string, File> = new Map();
  private courtAlerts: Map<string, CourtAlert> = new Map();
  private aiAnalysisResults: Map<string, AiAnalysisResult> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo organization
    const orgId = randomUUID();
    const org: Organization = {
      id: orgId,
      name: "Kumar & Associates",
      type: "chambers",
      bcisafeMode: true,
      state: "Delhi",
      gstNumber: "07AAAAA0000A1Z5",
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(orgId, org);

    // Create demo user
    const userId = randomUUID();
    const user: User = {
      id: userId,
      orgId,
      username: "adv.kumar",
      email: "kumar@example.com",
      name: "Adv. Kumar",
      role: "owner",
      barCouncilId: "D/1234/2015",
      phone: "+91 98765 43210",
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userId, user);

    // Create demo matters
    const matter1Id = randomUUID();
    const matter1: Matter = {
      id: matter1Id,
      orgId,
      caseNo: "CS 234/2024",
      filingNo: "12345/2024",
      title: "Sharma vs. Verma & Ors.",
      court: "Delhi High Court",
      forum: "Civil Side",
      judge: "Justice Mehta",
      subject: "Contract Dispute",
      stage: "Arguments",
      status: "active",
      priority: "high",
      leadCounselId: userId,
      cnrNumber: "DLHC010123452024",
      tags: ["commercial", "contract"],
      nextHearingDate: new Date("2025-01-14T10:00:00Z"),
      filingDate: new Date("2024-01-15"),
      metadata: {},
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matters.set(matter1Id, matter1);

    const matter2Id = randomUUID();
    const matter2: Matter = {
      id: matter2Id,
      orgId,
      caseNo: "W.P.(C) 7890/2024",
      filingNo: "78901/2024",
      title: "Kumar vs. Union of India",
      court: "Delhi High Court",
      forum: "Constitutional Bench",
      judge: "Justice Patel",
      subject: "Service Matter",
      stage: "Notice Stage",
      status: "active",
      priority: "medium",
      leadCounselId: userId,
      cnrNumber: "DLHC010789012024",
      tags: ["service", "government"],
      nextHearingDate: new Date("2025-01-28T11:30:00Z"),
      filingDate: new Date("2024-02-01"),
      metadata: {},
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matters.set(matter2Id, matter2);

    // Create demo hearing for today
    const hearingId = randomUUID();
    const hearing: Hearing = {
      id: hearingId,
      orgId,
      matterId: matter1Id,
      date: new Date("2025-01-14T10:00:00Z"),
      time: "10:00 AM",
      court: "Delhi High Court",
      judge: "Justice Mehta",
      bench: "Court No. 5",
      purpose: "Arguments on IA 4567/2024",
      result: "",
      nextDate: null,
      notes: "",
      status: "scheduled",
      metadata: {},
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hearings.set(hearingId, hearing);

    // Create demo party
    const partyId = randomUUID();
    const party: Party = {
      id: partyId,
      orgId,
      matterId: matter1Id,
      name: "Mr. Manoj Sharma",
      role: "petitioner",
      type: "client",
      email: "manoj.s@example.com",
      phone: "+91 98765 43210",
      address: "123 Main Street, Delhi",
      state: "Delhi",
      panNumber: "ABCDE1234F",
      aadharNumber: null,
      metadata: {},
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.parties.set(partyId, party);

    // Create demo court alert
    const alertId = randomUUID();
    const alert: CourtAlert = {
      id: alertId,
      orgId,
      matterId: matter1Id,
      type: "deadline_approaching",
      title: "Filing Deadline",
      message: "Reply affidavit due in 3 days for CS 234/2024",
      urgency: "high",
      source: "ai_detected",
      actionRequired: true,
      dueDate: new Date("2025-01-17"),
      resolvedAt: null,
      metadata: {},
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.courtAlerts.set(alertId, alert);

    // Create demo time entries
    const timeEntry1Id = randomUUID();
    const timeEntry1: TimeEntry = {
      id: timeEntry1Id,
      orgId,
      matterId: matter1Id,
      userId,
      description: "Drafted petition and reviewed legal precedents",
      duration: 180,
      rate: "5000",
      isBillable: true,
      startTime: new Date("2024-12-15T10:00:00Z"),
      endTime: new Date("2024-12-15T13:00:00Z"),
      metadata: {},
      isDeleted: false,
      createdAt: new Date("2024-12-15"),
    };
    this.timeEntries.set(timeEntry1Id, timeEntry1);

    const timeEntry2Id = randomUUID();
    const timeEntry2: TimeEntry = {
      id: timeEntry2Id,
      orgId,
      matterId: matter1Id,
      userId,
      description: "Court appearance and arguments",
      duration: 120,
      rate: "8000",
      isBillable: true,
      startTime: new Date("2024-12-20T11:00:00Z"),
      endTime: new Date("2024-12-20T13:00:00Z"),
      metadata: {},
      isDeleted: false,
      createdAt: new Date("2024-12-20"),
    };
    this.timeEntries.set(timeEntry2Id, timeEntry2);

    // Create demo expenses
    const expense1Id = randomUUID();
    const expense1: Expense = {
      id: expense1Id,
      orgId,
      matterId: matter1Id,
      userId,
      category: "Court Fees",
      description: "Filing fees for petition",
      amount: "2500",
      tax: "0",
      receipt: null,
      date: new Date("2024-12-10"),
      isBillable: true,
      metadata: {},
      isDeleted: false,
      createdAt: new Date("2024-12-10"),
    };
    this.expenses.set(expense1Id, expense1);

    const expense2Id = randomUUID();
    const expense2: Expense = {
      id: expense2Id,
      orgId,
      matterId: matter1Id,
      userId,
      category: "Travel",
      description: "Travel to court for hearing",
      amount: "1500",
      tax: "0",
      receipt: null,
      date: new Date("2024-12-20"),
      isBillable: true,
      metadata: {},
      isDeleted: false,
      createdAt: new Date("2024-12-20"),
    };
    this.expenses.set(expense2Id, expense2);
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...orgData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(id, org);
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updated = { ...org, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updated);
    return updated;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.orgId === orgId);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...userData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // Matters
  async getMatter(id: string): Promise<Matter | undefined> {
    const matter = this.matters.get(id);
    return matter?.isDeleted ? undefined : matter;
  }

  async getMattersByOrg(orgId: string, filters?: { status?: string; stage?: string }): Promise<Matter[]> {
    return Array.from(this.matters.values())
      .filter(matter => 
        matter.orgId === orgId && 
        !matter.isDeleted &&
        (!filters?.status || matter.status === filters.status) &&
        (!filters?.stage || matter.stage === filters.stage)
      );
  }

  async createMatter(matterData: InsertMatter): Promise<Matter> {
    const id = randomUUID();
    const matter: Matter = {
      ...matterData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matters.set(id, matter);
    return matter;
  }

  async updateMatter(id: string, updates: Partial<Matter>): Promise<Matter | undefined> {
    const matter = this.matters.get(id);
    if (!matter || matter.isDeleted) return undefined;
    
    const updated = { ...matter, ...updates, updatedAt: new Date() };
    this.matters.set(id, updated);
    return updated;
  }

  async deleteMatter(id: string): Promise<boolean> {
    const matter = this.matters.get(id);
    if (!matter) return false;
    
    const updated = { ...matter, isDeleted: true, updatedAt: new Date() };
    this.matters.set(id, updated);
    return true;
  }

  // Parties
  async getPartiesByMatter(matterId: string): Promise<Party[]> {
    return Array.from(this.parties.values())
      .filter(party => party.matterId === matterId && !party.isDeleted);
  }

  async getPartiesByOrg(orgId: string): Promise<Party[]> {
    return Array.from(this.parties.values())
      .filter(party => party.orgId === orgId && !party.isDeleted);
  }

  async createParty(partyData: InsertParty): Promise<Party> {
    const id = randomUUID();
    const party: Party = {
      ...partyData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.parties.set(id, party);
    return party;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined> {
    const party = this.parties.get(id);
    if (!party || party.isDeleted) return undefined;
    
    const updated = { ...party, ...updates, updatedAt: new Date() };
    this.parties.set(id, updated);
    return updated;
  }

  // Hearings
  async getHearing(id: string): Promise<Hearing | undefined> {
    const hearing = this.hearings.get(id);
    return hearing?.isDeleted ? undefined : hearing;
  }

  async getHearingsByMatter(matterId: string): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(hearing => hearing.matterId === matterId && !hearing.isDeleted)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getHearingsByDateRange(orgId: string, startDate: Date, endDate: Date): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(hearing => 
        hearing.orgId === orgId && 
        !hearing.isDeleted &&
        hearing.date >= startDate && 
        hearing.date <= endDate
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getTodaysHearings(orgId: string): Promise<Hearing[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getHearingsByDateRange(orgId, startOfDay, endOfDay);
  }

  async createHearing(hearingData: InsertHearing): Promise<Hearing> {
    const id = randomUUID();
    const hearing: Hearing = {
      ...hearingData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hearings.set(id, hearing);
    return hearing;
  }

  async updateHearing(id: string, updates: Partial<Hearing>): Promise<Hearing | undefined> {
    const hearing = this.hearings.get(id);
    if (!hearing || hearing.isDeleted) return undefined;
    
    const updated = { ...hearing, ...updates, updatedAt: new Date() };
    this.hearings.set(id, updated);
    return updated;
  }

  // Dockets
  async getDocketsByMatter(matterId: string): Promise<Docket[]> {
    return Array.from(this.dockets.values())
      .filter(docket => docket.matterId === matterId && !docket.isDeleted)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createDocket(docketData: InsertDocket): Promise<Docket> {
    const id = randomUUID();
    const docket: Docket = {
      ...docketData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dockets.set(id, docket);
    return docket;
  }

  // Tasks
  async getTasksByMatter(matterId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.matterId === matterId && !task.isDeleted);
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assigneeId === userId && !task.isDeleted);
  }

  async getTasksByOrg(orgId: string, filters?: { status?: string; priority?: string }): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => 
        task.orgId === orgId && 
        !task.isDeleted &&
        (!filters?.status || task.status === filters.status) &&
        (!filters?.priority || task.priority === filters.priority)
      );
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...taskData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task || task.isDeleted) return undefined;
    
    const updated = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  // Time Entries
  async getTimeEntriesByMatter(matterId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter(entry => entry.matterId === matterId && !entry.isDeleted);
  }

  async getTimeEntriesByUser(userId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter(entry => entry.userId === userId && !entry.isDeleted);
  }

  async createTimeEntry(entryData: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const entry: TimeEntry = {
      ...entryData,
      id,
      isDeleted: false,
      createdAt: new Date(),
    };
    this.timeEntries.set(id, entry);
    return entry;
  }

  // Expenses
  async getExpensesByMatter(matterId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.matterId === matterId && !expense.isDeleted);
  }

  async getExpensesByOrg(orgId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.orgId === orgId && !expense.isDeleted)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...expenseData,
      id,
      isDeleted: false,
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  // Invoices
  async getInvoicesByOrg(orgId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.orgId === orgId && !invoice.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    return invoice?.isDeleted ? undefined : invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      ...invoiceData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.isDeleted) return undefined;
    
    const updated = { ...invoice, ...updates, updatedAt: new Date() };
    this.invoices.set(id, updated);
    return updated;
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updated = { ...notification, readAt: new Date() };
    this.notifications.set(id, updated);
    return true;
  }

  // Files
  async getFilesByMatter(matterId: string): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.matterId === matterId && !file.isDeleted);
  }

  async getFile(id: string): Promise<File | undefined> {
    const file = this.files.get(id);
    return file?.isDeleted ? undefined : file;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = {
      ...fileData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  // Court Alerts
  async getCourtAlertsByOrg(orgId: string): Promise<CourtAlert[]> {
    return Array.from(this.courtAlerts.values())
      .filter(alert => alert.orgId === orgId && !alert.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCourtAlertsByMatter(matterId: string): Promise<CourtAlert[]> {
    return Array.from(this.courtAlerts.values())
      .filter(alert => alert.matterId === matterId && !alert.isDeleted);
  }

  async createCourtAlert(alertData: InsertCourtAlert): Promise<CourtAlert> {
    const id = randomUUID();
    const alert: CourtAlert = {
      ...alertData,
      id,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.courtAlerts.set(id, alert);
    return alert;
  }

  async updateCourtAlert(id: string, updates: Partial<CourtAlert>): Promise<CourtAlert | undefined> {
    const alert = this.courtAlerts.get(id);
    if (!alert || alert.isDeleted) return undefined;
    
    const updated = { ...alert, ...updates, updatedAt: new Date() };
    this.courtAlerts.set(id, updated);
    return updated;
  }

  // AI Analysis
  async getAiAnalysisResultsByMatter(matterId: string): Promise<AiAnalysisResult[]> {
    return Array.from(this.aiAnalysisResults.values())
      .filter(result => result.matterId === matterId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAiAnalysisResult(resultData: InsertAiAnalysisResult): Promise<AiAnalysisResult> {
    const id = randomUUID();
    const result: AiAnalysisResult = {
      ...resultData,
      id,
      createdAt: new Date(),
    };
    this.aiAnalysisResults.set(id, result);
    return result;
  }
}

function cleanData<T extends Record<string, any>>(data: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === undefined ? null : value;
  }
  return cleaned;
}

export class DbStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    try {
      const existingOrgs = await db.select().from(organizations).limit(1);
      if (existingOrgs.length > 0) {
        console.log("Database already seeded");
        return;
      }

      console.log("Seeding database...");

      const [org] = await db.insert(organizations).values(cleanData({
        name: "Kumar & Associates",
        type: "chambers",
        bcisafeMode: true,
        state: "Delhi",
        gstNumber: "07AAAAA0000A1Z5",
        settings: {},
      })).returning();

      const [user] = await db.insert(users).values(cleanData({
        orgId: org.id,
        username: "adv.kumar",
        email: "kumar@example.com",
        name: "Adv. Kumar",
        role: "owner",
        barCouncilId: "D/1234/2015",
        phone: "+91 98765 43210",
        settings: {},
      })).returning();

      const [matter1] = await db.insert(matters).values(cleanData({
        orgId: org.id,
        caseNo: "CS 234/2024",
        filingNo: "12345/2024",
        title: "Sharma vs. Verma & Ors.",
        court: "Delhi High Court",
        forum: "Civil Side",
        judge: "Justice Mehta",
        subject: "Contract Dispute",
        stage: "Arguments",
        status: "active",
        priority: "high",
        leadCounselId: user.id,
        cnrNumber: "DLHC010123452024",
        tags: ["commercial", "contract"],
        nextHearingDate: new Date("2025-01-14T10:00:00Z"),
        filingDate: new Date("2024-01-15"),
        metadata: {},
      })).returning();

      const [matter2] = await db.insert(matters).values(cleanData({
        orgId: org.id,
        caseNo: "W.P.(C) 7890/2024",
        filingNo: "78901/2024",
        title: "Kumar vs. Union of India",
        court: "Delhi High Court",
        forum: "Constitutional Bench",
        judge: "Justice Patel",
        subject: "Service Matter",
        stage: "Notice Stage",
        status: "active",
        priority: "medium",
        leadCounselId: user.id,
        cnrNumber: "DLHC010789012024",
        tags: ["service", "government"],
        nextHearingDate: new Date("2025-01-28T11:30:00Z"),
        filingDate: new Date("2024-02-01"),
        metadata: {},
      })).returning();

      await db.insert(hearings).values(cleanData({
        orgId: org.id,
        matterId: matter1.id,
        date: new Date("2025-01-14T10:00:00Z"),
        time: "10:00 AM",
        court: "Delhi High Court",
        judge: "Justice Mehta",
        bench: "Court No. 5",
        purpose: "Arguments on IA 4567/2024",
        result: "",
        nextDate: null,
        notes: "",
        status: "scheduled",
        metadata: {},
      }));

      await db.insert(parties).values(cleanData({
        orgId: org.id,
        matterId: matter1.id,
        name: "Mr. Manoj Sharma",
        role: "petitioner",
        type: "client",
        email: "manoj.s@example.com",
        phone: "+91 98765 43210",
        address: "123 Main Street, Delhi",
        state: "Delhi",
        panNumber: "ABCDE1234F",
        aadharNumber: null,
        metadata: {},
      }));

      await db.insert(courtAlerts).values(cleanData({
        orgId: org.id,
        matterId: matter1.id,
        type: "deadline_approaching",
        title: "Filing Deadline",
        message: "Reply affidavit due in 3 days for CS 234/2024",
        urgency: "high",
        source: "ai_detected",
        actionRequired: true,
        dueDate: new Date("2025-01-17"),
        resolvedAt: null,
        metadata: {},
      }));

      await db.insert(timeEntries).values([
        cleanData({
          orgId: org.id,
          matterId: matter1.id,
          userId: user.id,
          description: "Drafted petition and reviewed legal precedents",
          duration: 180,
          rate: "5000",
          isBillable: true,
          startTime: new Date("2024-12-15T10:00:00Z"),
          endTime: new Date("2024-12-15T13:00:00Z"),
          metadata: {},
        }),
        cleanData({
          orgId: org.id,
          matterId: matter1.id,
          userId: user.id,
          description: "Court appearance and arguments",
          duration: 120,
          rate: "8000",
          isBillable: true,
          startTime: new Date("2024-12-20T11:00:00Z"),
          endTime: new Date("2024-12-20T13:00:00Z"),
          metadata: {},
        })
      ]);

      await db.insert(expenses).values([
        cleanData({
          orgId: org.id,
          matterId: matter1.id,
          userId: user.id,
          category: "Court Fees",
          description: "Filing fees for petition",
          amount: "2500",
          tax: "0",
          receipt: null,
          date: new Date("2024-12-10"),
          isBillable: true,
          metadata: {},
        }),
        cleanData({
          orgId: org.id,
          matterId: matter1.id,
          userId: user.id,
          category: "Travel",
          description: "Travel to court for hearing",
          amount: "1500",
          tax: "0",
          receipt: null,
          date: new Date("2024-12-20"),
          isBillable: true,
          metadata: {},
        })
      ]);

      console.log("Database seeded successfully");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    try {
      const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting organization:", error);
      return undefined;
    }
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    try {
      const [org] = await db.insert(organizations).values(cleanData(orgData)).returning();
      return org;
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    try {
      const [updated] = await db.update(organizations)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(eq(organizations.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating organization:", error);
      return undefined;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    try {
      return await db.select().from(users).where(eq(users.orgId, orgId));
    } catch (error) {
      console.error("Error getting users by org:", error);
      return [];
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(cleanData(userData)).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(users)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(eq(users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getMatter(id: string): Promise<Matter | undefined> {
    try {
      const result = await db.select().from(matters)
        .where(and(eq(matters.id, id), eq(matters.isDeleted, false)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting matter:", error);
      return undefined;
    }
  }

  async getMattersByOrg(orgId: string, filters?: { status?: string; stage?: string }): Promise<Matter[]> {
    try {
      const conditions = [eq(matters.orgId, orgId), eq(matters.isDeleted, false)];
      
      if (filters?.status) {
        conditions.push(eq(matters.status, filters.status));
      }
      if (filters?.stage) {
        conditions.push(eq(matters.stage, filters.stage));
      }

      return await db.select().from(matters).where(and(...conditions));
    } catch (error) {
      console.error("Error getting matters by org:", error);
      return [];
    }
  }

  async createMatter(matterData: InsertMatter): Promise<Matter> {
    try {
      const [matter] = await db.insert(matters).values(cleanData(matterData)).returning();
      return matter;
    } catch (error) {
      console.error("Error creating matter:", error);
      throw error;
    }
  }

  async updateMatter(id: string, updates: Partial<Matter>): Promise<Matter | undefined> {
    try {
      const [updated] = await db.update(matters)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(matters.id, id), eq(matters.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating matter:", error);
      return undefined;
    }
  }

  async deleteMatter(id: string): Promise<boolean> {
    try {
      const result = await db.update(matters)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(matters.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting matter:", error);
      return false;
    }
  }

  async getPartiesByMatter(matterId: string): Promise<Party[]> {
    try {
      return await db.select().from(parties)
        .where(and(eq(parties.matterId, matterId), eq(parties.isDeleted, false)));
    } catch (error) {
      console.error("Error getting parties by matter:", error);
      return [];
    }
  }

  async getPartiesByOrg(orgId: string): Promise<Party[]> {
    try {
      return await db.select().from(parties)
        .where(and(eq(parties.orgId, orgId), eq(parties.isDeleted, false)));
    } catch (error) {
      console.error("Error getting parties by org:", error);
      return [];
    }
  }

  async createParty(partyData: InsertParty): Promise<Party> {
    try {
      const [party] = await db.insert(parties).values(cleanData(partyData)).returning();
      return party;
    } catch (error) {
      console.error("Error creating party:", error);
      throw error;
    }
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | undefined> {
    try {
      const [updated] = await db.update(parties)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(parties.id, id), eq(parties.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating party:", error);
      return undefined;
    }
  }

  async getHearing(id: string): Promise<Hearing | undefined> {
    try {
      const result = await db.select().from(hearings)
        .where(and(eq(hearings.id, id), eq(hearings.isDeleted, false)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting hearing:", error);
      return undefined;
    }
  }

  async getHearingsByMatter(matterId: string): Promise<Hearing[]> {
    try {
      return await db.select().from(hearings)
        .where(and(eq(hearings.matterId, matterId), eq(hearings.isDeleted, false)))
        .orderBy(hearings.date);
    } catch (error) {
      console.error("Error getting hearings by matter:", error);
      return [];
    }
  }

  async getHearingsByDateRange(orgId: string, startDate: Date, endDate: Date): Promise<Hearing[]> {
    try {
      return await db.select().from(hearings)
        .where(and(
          eq(hearings.orgId, orgId),
          eq(hearings.isDeleted, false),
          gte(hearings.date, startDate),
          lte(hearings.date, endDate)
        ))
        .orderBy(hearings.date);
    } catch (error) {
      console.error("Error getting hearings by date range:", error);
      return [];
    }
  }

  async getTodaysHearings(orgId: string): Promise<Hearing[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return this.getHearingsByDateRange(orgId, startOfDay, endOfDay);
  }

  async createHearing(hearingData: InsertHearing): Promise<Hearing> {
    try {
      const [hearing] = await db.insert(hearings).values(cleanData(hearingData)).returning();
      return hearing;
    } catch (error) {
      console.error("Error creating hearing:", error);
      throw error;
    }
  }

  async updateHearing(id: string, updates: Partial<Hearing>): Promise<Hearing | undefined> {
    try {
      const [updated] = await db.update(hearings)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(hearings.id, id), eq(hearings.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating hearing:", error);
      return undefined;
    }
  }

  async getDocketsByMatter(matterId: string): Promise<Docket[]> {
    try {
      return await db.select().from(dockets)
        .where(and(eq(dockets.matterId, matterId), eq(dockets.isDeleted, false)))
        .orderBy(desc(dockets.date));
    } catch (error) {
      console.error("Error getting dockets by matter:", error);
      return [];
    }
  }

  async createDocket(docketData: InsertDocket): Promise<Docket> {
    try {
      const [docket] = await db.insert(dockets).values(cleanData(docketData)).returning();
      return docket;
    } catch (error) {
      console.error("Error creating docket:", error);
      throw error;
    }
  }

  async getTasksByMatter(matterId: string): Promise<Task[]> {
    try {
      return await db.select().from(tasks)
        .where(and(eq(tasks.matterId, matterId), eq(tasks.isDeleted, false)));
    } catch (error) {
      console.error("Error getting tasks by matter:", error);
      return [];
    }
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      return await db.select().from(tasks)
        .where(and(eq(tasks.assigneeId, userId), eq(tasks.isDeleted, false)));
    } catch (error) {
      console.error("Error getting tasks by user:", error);
      return [];
    }
  }

  async getTasksByOrg(orgId: string, filters?: { status?: string; priority?: string }): Promise<Task[]> {
    try {
      const conditions = [eq(tasks.orgId, orgId), eq(tasks.isDeleted, false)];
      
      if (filters?.status) {
        conditions.push(eq(tasks.status, filters.status));
      }
      if (filters?.priority) {
        conditions.push(eq(tasks.priority, filters.priority));
      }

      return await db.select().from(tasks).where(and(...conditions));
    } catch (error) {
      console.error("Error getting tasks by org:", error);
      return [];
    }
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    try {
      const [task] = await db.insert(tasks).values(cleanData(taskData)).returning();
      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    try {
      const [updated] = await db.update(tasks)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(tasks.id, id), eq(tasks.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating task:", error);
      return undefined;
    }
  }

  async getTimeEntriesByMatter(matterId: string): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries)
        .where(and(eq(timeEntries.matterId, matterId), eq(timeEntries.isDeleted, false)));
    } catch (error) {
      console.error("Error getting time entries by matter:", error);
      return [];
    }
  }

  async getTimeEntriesByUser(userId: string): Promise<TimeEntry[]> {
    try {
      return await db.select().from(timeEntries)
        .where(and(eq(timeEntries.userId, userId), eq(timeEntries.isDeleted, false)));
    } catch (error) {
      console.error("Error getting time entries by user:", error);
      return [];
    }
  }

  async createTimeEntry(entryData: InsertTimeEntry): Promise<TimeEntry> {
    try {
      const [entry] = await db.insert(timeEntries).values(cleanData(entryData)).returning();
      return entry;
    } catch (error) {
      console.error("Error creating time entry:", error);
      throw error;
    }
  }

  async getExpensesByMatter(matterId: string): Promise<Expense[]> {
    try {
      return await db.select().from(expenses)
        .where(and(eq(expenses.matterId, matterId), eq(expenses.isDeleted, false)));
    } catch (error) {
      console.error("Error getting expenses by matter:", error);
      return [];
    }
  }

  async getExpensesByOrg(orgId: string): Promise<Expense[]> {
    try {
      return await db.select().from(expenses)
        .where(and(eq(expenses.orgId, orgId), eq(expenses.isDeleted, false)))
        .orderBy(desc(expenses.date));
    } catch (error) {
      console.error("Error getting expenses by org:", error);
      return [];
    }
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    try {
      const [expense] = await db.insert(expenses).values(cleanData(expenseData)).returning();
      return expense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  async getInvoicesByOrg(orgId: string): Promise<Invoice[]> {
    try {
      return await db.select().from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.isDeleted, false)))
        .orderBy(desc(invoices.createdAt));
    } catch (error) {
      console.error("Error getting invoices by org:", error);
      return [];
    }
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    try {
      const result = await db.select().from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.isDeleted, false)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting invoice:", error);
      return undefined;
    }
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    try {
      const [invoice] = await db.insert(invoices).values(cleanData(invoiceData)).returning();
      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const [updated] = await db.update(invoices)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(invoices.id, id), eq(invoices.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating invoice:", error);
      return undefined;
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      return await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      return [];
    }
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const [notification] = await db.insert(notifications).values(cleanData(notificationData)).returning();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const result = await db.update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error marking notification read:", error);
      return false;
    }
  }

  async getFilesByMatter(matterId: string): Promise<File[]> {
    try {
      return await db.select().from(files)
        .where(and(eq(files.matterId, matterId), eq(files.isDeleted, false)));
    } catch (error) {
      console.error("Error getting files by matter:", error);
      return [];
    }
  }

  async getFile(id: string): Promise<File | undefined> {
    try {
      const result = await db.select().from(files)
        .where(and(eq(files.id, id), eq(files.isDeleted, false)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting file:", error);
      return undefined;
    }
  }

  async createFile(fileData: InsertFile): Promise<File> {
    try {
      const [file] = await db.insert(files).values(cleanData(fileData)).returning();
      return file;
    } catch (error) {
      console.error("Error creating file:", error);
      throw error;
    }
  }

  async getCourtAlertsByOrg(orgId: string): Promise<CourtAlert[]> {
    try {
      return await db.select().from(courtAlerts)
        .where(and(eq(courtAlerts.orgId, orgId), eq(courtAlerts.isDeleted, false)))
        .orderBy(desc(courtAlerts.createdAt));
    } catch (error) {
      console.error("Error getting court alerts by org:", error);
      return [];
    }
  }

  async getCourtAlertsByMatter(matterId: string): Promise<CourtAlert[]> {
    try {
      return await db.select().from(courtAlerts)
        .where(and(eq(courtAlerts.matterId, matterId), eq(courtAlerts.isDeleted, false)));
    } catch (error) {
      console.error("Error getting court alerts by matter:", error);
      return [];
    }
  }

  async createCourtAlert(alertData: InsertCourtAlert): Promise<CourtAlert> {
    try {
      const [alert] = await db.insert(courtAlerts).values(cleanData(alertData)).returning();
      return alert;
    } catch (error) {
      console.error("Error creating court alert:", error);
      throw error;
    }
  }

  async updateCourtAlert(id: string, updates: Partial<CourtAlert>): Promise<CourtAlert | undefined> {
    try {
      const [updated] = await db.update(courtAlerts)
        .set(cleanData({ ...updates, updatedAt: new Date() }))
        .where(and(eq(courtAlerts.id, id), eq(courtAlerts.isDeleted, false)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating court alert:", error);
      return undefined;
    }
  }

  async getAiAnalysisResultsByMatter(matterId: string): Promise<AiAnalysisResult[]> {
    try {
      return await db.select().from(aiAnalysisResults)
        .where(eq(aiAnalysisResults.matterId, matterId))
        .orderBy(desc(aiAnalysisResults.createdAt));
    } catch (error) {
      console.error("Error getting AI analysis results by matter:", error);
      return [];
    }
  }

  async createAiAnalysisResult(resultData: InsertAiAnalysisResult): Promise<AiAnalysisResult> {
    try {
      const [result] = await db.insert(aiAnalysisResults).values(cleanData(resultData)).returning();
      return result;
    } catch (error) {
      console.error("Error creating AI analysis result:", error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
