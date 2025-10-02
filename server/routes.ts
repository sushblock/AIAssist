import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ecourtService } from "./services/ecourts";
import { aiAgentService } from "./services/ai-agents";
import { 
  insertMatterSchema, 
  insertPartySchema, 
  insertHearingSchema,
  insertTaskSchema,
  insertTimeEntrySchema,
  insertInvoiceSchema,
  insertFileSchema,
  insertCourtAlertSchema,
  insertDocketSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user's organization
  let cachedOrgId: string | null = null;
  let cachedUserId: string | null = null;

  const getCurrentOrgId = async (): Promise<string> => {
    if (cachedOrgId) return cachedOrgId;
    
    const user = await storage.getUserByUsername("adv.kumar");
    if (user?.orgId) {
      cachedOrgId = user.orgId;
      return cachedOrgId;
    }
    
    throw new Error("No organization found");
  };

  const getCurrentUserId = async (): Promise<string> => {
    if (cachedUserId) return cachedUserId;
    
    const user = await storage.getUserByUsername("adv.kumar");
    if (user) {
      cachedUserId = user.id;
      cachedOrgId = user.orgId || cachedOrgId;
      return cachedUserId;
    }
    
    throw new Error("No user found");
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const today = new Date();
      
      const [todaysHearings, pendingTasks, courtAlerts, activeMatters] = await Promise.all([
        storage.getTodaysHearings(orgId),
        storage.getTasksByOrg(orgId, { status: "pending" }),
        storage.getCourtAlertsByOrg(orgId),
        storage.getMattersByOrg(orgId, { status: "active" })
      ]);

      const pendingTasksCount = pendingTasks.length;
      const overdueTasks = pendingTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < today
      ).length;

      const newAlerts = courtAlerts.filter(alert => 
        !alert.resolvedAt && 
        new Date(alert.createdAt).toDateString() === today.toDateString()
      ).length;

      res.json({
        todayHearings: todaysHearings.length,
        pendingTasks: pendingTasksCount,
        overdueTasks,
        newAlerts,
        activeMatters: activeMatters.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard insights (AI-powered)
  app.get("/api/dashboard/insights", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      
      const [todaysHearings, pendingTasks, recentAlerts, activeMatters] = await Promise.all([
        storage.getTodaysHearings(orgId),
        storage.getTasksByOrg(orgId, { status: "pending" }),
        storage.getCourtAlertsByOrg(orgId),
        storage.getMattersByOrg(orgId, { status: "active" })
      ]);

      const insights = await aiAgentService.generateDashboardInsights({
        todaysHearings,
        pendingTasks,
        recentAlerts: recentAlerts.slice(0, 5),
        activeMatters
      });

      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Matters CRUD
  app.get("/api/matters", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const { status, stage } = req.query;
      
      const matters = await storage.getMattersByOrg(orgId, {
        status: status as string,
        stage: stage as string
      });

      res.json(matters);
    } catch (error) {
      console.error("Error fetching matters:", error);
      res.status(500).json({ message: "Failed to fetch matters" });
    }
  });

  app.get("/api/matters/:id", async (req, res) => {
    try {
      const matter = await storage.getMatter(req.params.id);
      if (!matter) {
        return res.status(404).json({ message: "Matter not found" });
      }

      const [parties, hearings, dockets, tasks] = await Promise.all([
        storage.getPartiesByMatter(matter.id),
        storage.getHearingsByMatter(matter.id),
        storage.getDocketsByMatter(matter.id),
        storage.getTasksByMatter(matter.id)
      ]);

      res.json({
        ...matter,
        parties,
        hearings,
        dockets,
        tasks
      });
    } catch (error) {
      console.error("Error fetching matter:", error);
      res.status(500).json({ message: "Failed to fetch matter" });
    }
  });

  app.post("/api/matters", async (req, res) => {
    try {
      const matterData = insertMatterSchema.parse({
        ...req.body,
        orgId: getCurrentOrgId(),
        leadCounselId: getCurrentUserId()
      });

      const matter = await storage.createMatter(matterData);
      res.status(201).json(matter);
    } catch (error) {
      console.error("Error creating matter:", error);
      res.status(400).json({ message: "Failed to create matter" });
    }
  });

  app.put("/api/matters/:id", async (req, res) => {
    try {
      const updates = req.body;
      const matter = await storage.updateMatter(req.params.id, updates);
      
      if (!matter) {
        return res.status(404).json({ message: "Matter not found" });
      }

      res.json(matter);
    } catch (error) {
      console.error("Error updating matter:", error);
      res.status(400).json({ message: "Failed to update matter" });
    }
  });

  // Hearings
  app.get("/api/hearings/today", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const hearings = await storage.getTodaysHearings(orgId);
      
      // Enrich with matter details
      const enrichedHearings = await Promise.all(
        hearings.map(async (hearing) => {
          const matter = await storage.getMatter(hearing.matterId!);
          return { ...hearing, matter };
        })
      );

      res.json(enrichedHearings);
    } catch (error) {
      console.error("Error fetching today's hearings:", error);
      res.status(500).json({ message: "Failed to fetch hearings" });
    }
  });

  app.get("/api/hearings/date-range", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const hearings = await storage.getHearingsByDateRange(
        orgId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(hearings);
    } catch (error) {
      console.error("Error fetching hearings by date range:", error);
      res.status(500).json({ message: "Failed to fetch hearings" });
    }
  });

  app.post("/api/hearings", async (req, res) => {
    try {
      const hearingData = insertHearingSchema.parse({
        ...req.body,
        orgId: getCurrentOrgId()
      });

      const hearing = await storage.createHearing(hearingData);
      res.status(201).json(hearing);
    } catch (error) {
      console.error("Error creating hearing:", error);
      res.status(400).json({ message: "Failed to create hearing" });
    }
  });

  // Parties
  app.get("/api/parties", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const parties = await storage.getPartiesByOrg(orgId);
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });

  app.post("/api/parties", async (req, res) => {
    try {
      const partyData = insertPartySchema.parse({
        ...req.body,
        orgId: getCurrentOrgId()
      });

      const party = await storage.createParty(partyData);
      res.status(201).json(party);
    } catch (error) {
      console.error("Error creating party:", error);
      res.status(400).json({ message: "Failed to create party" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const { status, priority, matterId } = req.query;
      
      let tasks;
      if (matterId) {
        tasks = await storage.getTasksByMatter(matterId as string);
      } else {
        tasks = await storage.getTasksByOrg(orgId, {
          status: status as string,
          priority: priority as string
        });
      }

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        orgId: getCurrentOrgId(),
        assigneeId: req.body.assigneeId || getCurrentUserId()
      });

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  // Court Alerts
  app.get("/api/court-alerts", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const alerts = await storage.getCourtAlertsByOrg(orgId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching court alerts:", error);
      res.status(500).json({ message: "Failed to fetch court alerts" });
    }
  });

  app.post("/api/court-alerts", async (req, res) => {
    try {
      const alertData = insertCourtAlertSchema.parse({
        ...req.body,
        orgId: getCurrentOrgId()
      });

      const alert = await storage.createCourtAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating court alert:", error);
      res.status(400).json({ message: "Failed to create court alert" });
    }
  });

  app.put("/api/court-alerts/:id/resolve", async (req, res) => {
    try {
      const alert = await storage.updateCourtAlert(req.params.id, {
        resolvedAt: new Date()
      });
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(400).json({ message: "Failed to resolve alert" });
    }
  });

  // eCourts Integration
  app.post("/api/ecourts/search/cnr", async (req, res) => {
    try {
      const { cnrNumber } = req.body;
      
      if (!cnrNumber) {
        return res.status(400).json({ message: "CNR number is required" });
      }

      const caseData = await ecourtService.searchByCNR(cnrNumber);
      res.json(caseData);
    } catch (error) {
      console.error("Error searching eCourts by CNR:", error);
      res.status(500).json({ message: "Failed to search eCourts" });
    }
  });

  app.post("/api/ecourts/search/case", async (req, res) => {
    try {
      const { caseNumber, court } = req.body;
      
      if (!caseNumber || !court) {
        return res.status(400).json({ message: "Case number and court are required" });
      }

      const caseData = await ecourtService.searchByCaseNumber(caseNumber, court);
      res.json(caseData);
    } catch (error) {
      console.error("Error searching eCourts by case number:", error);
      res.status(500).json({ message: "Failed to search eCourts" });
    }
  });

  app.get("/api/ecourts/causelist/:court", async (req, res) => {
    try {
      const { court } = req.params;
      const causeList = await ecourtService.getTodaysCauseList(court);
      res.json(causeList);
    } catch (error) {
      console.error("Error fetching cause list:", error);
      res.status(500).json({ message: "Failed to fetch cause list" });
    }
  });

  // AI Analysis
  app.post("/api/ai/analyze-document", async (req, res) => {
    try {
      const { documentContent, documentName, matterId } = req.body;
      
      if (!documentContent) {
        return res.status(400).json({ message: "Document content is required" });
      }

      const analysis = await aiAgentService.analyzeDocument(documentContent, documentName);
      
      // Save the analysis result
      if (matterId) {
        await storage.createAiAnalysisResult({
          orgId: getCurrentOrgId(),
          matterId,
          fileId: null,
          type: "document_analysis",
          prompt: `Analyze document: ${documentName}`,
          response: JSON.stringify(analysis),
          confidence: analysis.confidence,
          extractedData: analysis,
          model: "gemini-2.5-pro",
          tokensUsed: 0,
          processingTime: 0,
          metadata: {}
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  app.post("/api/ai/generate-case-summary", async (req, res) => {
    try {
      const { matterId } = req.body;
      
      if (!matterId) {
        return res.status(400).json({ message: "Matter ID is required" });
      }

      const [matter, dockets, parties] = await Promise.all([
        storage.getMatter(matterId),
        storage.getDocketsByMatter(matterId),
        storage.getPartiesByMatter(matterId)
      ]);

      if (!matter) {
        return res.status(404).json({ message: "Matter not found" });
      }

      const summary = await aiAgentService.generateCaseSummary(matter, dockets, parties);
      
      // Save the summary
      await storage.createAiAnalysisResult({
        orgId: getCurrentOrgId(),
        matterId,
        fileId: null,
        type: "case_summary",
        prompt: `Generate case summary for ${matter.caseNo}`,
        response: JSON.stringify(summary),
        confidence: 0.9,
        extractedData: summary,
        model: "gemini-2.5-pro",
        tokensUsed: 0,
        processingTime: 0,
        metadata: {}
      });

      res.json(summary);
    } catch (error) {
      console.error("Error generating case summary:", error);
      res.status(500).json({ message: "Failed to generate case summary" });
    }
  });

  app.post("/api/ai/smart-search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const orgId = await getCurrentOrgId();
      
      const [matters, files, parties] = await Promise.all([
        storage.getMattersByOrg(orgId),
        [], // TODO: Implement file search
        storage.getPartiesByOrg(orgId)
      ]);

      const results = await aiAgentService.performSmartSearch(query, {
        matters,
        documents: files,
        parties
      });

      res.json(results);
    } catch (error) {
      console.error("Error performing smart search:", error);
      res.status(500).json({ message: "Failed to perform smart search" });
    }
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const invoices = await storage.getInvoicesByOrg(orgId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        orgId: getCurrentOrgId()
      });

      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  // Time tracking
  app.get("/api/time-entries", async (req, res) => {
    try {
      const userId = await getCurrentUserId();
      const entries = await storage.getTimeEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const orgId = await getCurrentOrgId();
      const userId = await getCurrentUserId();
      
      const entryData = insertTimeEntrySchema.parse({
        ...req.body,
        orgId,
        userId,
        rate: req.body.rate?.toString(),
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
      });

      const entry = await storage.createTimeEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(400).json({ message: "Failed to create time entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
