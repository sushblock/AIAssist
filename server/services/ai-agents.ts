import { Ollama } from "ollama";
import type { Matter, File, Docket } from "@shared/schema";

const ollama = new Ollama({ host: 'http://localhost:11434' });

export interface DocumentAnalysisResult {
  documentType: string;
  keyDates: {
    date: string;
    type: string;
    description: string;
  }[];
  actionItems: string[];
  summary: string;
  parties?: string[];
  courtDetails?: {
    court: string;
    judge?: string;
    caseNumber?: string;
  };
  urgency: "low" | "medium" | "high" | "critical";
  confidence: number;
}

export interface CaseSummaryResult {
  executiveSummary: string;
  keyIssues: string[];
  currentStatus: string;
  nextSteps: string[];
  timeline: {
    date: string;
    event: string;
    significance: string;
  }[];
  riskAssessment: {
    level: "low" | "medium" | "high";
    factors: string[];
  };
}

export interface SmartSearchResult {
  type: "matter" | "party" | "document" | "task";
  id: string;
  title: string;
  summary: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}

export class AIAgentService {
  /**
   * Analyze a legal document using Ollama AI
   */
  async analyzeDocument(documentContent: string, documentName?: string): Promise<DocumentAnalysisResult> {
    try {
      const prompt = `You are an expert legal document analyzer. Analyze the provided legal document and extract key information in a structured format.

Focus on:
1. Document type identification
2. Key dates (hearings, deadlines, order dates)
3. Action items required
4. Brief summary
5. Parties involved
6. Court details
7. Urgency level assessment

Analyze this legal document:
${documentName ? `Document Name: ${documentName}\n` : ''}
Content:
${documentContent}

Extract and structure the key information.

Respond with ONLY valid JSON matching this exact structure:
{
  "documentType": "string",
  "keyDates": [
    {
      "date": "string",
      "type": "string",
      "description": "string"
    }
  ],
  "actionItems": ["string"],
  "summary": "string",
  "parties": ["string"],
  "courtDetails": {
    "court": "string",
    "judge": "string",
    "caseNumber": "string"
  },
  "urgency": "low|medium|high|critical",
  "confidence": 0.0-1.0
}

No markdown formatting, no explanations outside the JSON. Return only the JSON object.`;

      const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
      });

      const rawJson = response.message.content.trim();
      if (!rawJson) {
        throw new Error("Empty response from AI model");
      }

      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as DocumentAnalysisResult;
    } catch (error) {
      console.error("Error analyzing document:", error);
      throw new Error(`Failed to analyze document: ${error}`);
    }
  }

  /**
   * Generate a comprehensive case summary
   */
  async generateCaseSummary(matter: Matter, dockets: Docket[], parties: any[]): Promise<CaseSummaryResult> {
    try {
      const prompt = `You are an experienced legal analyst. Generate a comprehensive case summary based on the provided matter details, documents, and party information.

Provide:
1. Executive summary
2. Key legal issues
3. Current status
4. Recommended next steps
5. Timeline of significant events
6. Risk assessment

Be concise but thorough, focusing on actionable insights.

Generate a case summary for:

MATTER DETAILS:
Case Number: ${matter.caseNo}
Title: ${matter.title}
Court: ${matter.court}
Stage: ${matter.stage}
Subject: ${matter.subject}
Priority: ${matter.priority}

PARTIES:
${parties.map(p => `${p.role}: ${p.name} (${p.type})`).join('\n')}

RECENT DOCUMENTS/ORDERS:
${dockets.slice(0, 10).map(d => `${d.date}: ${d.title} - ${d.type}`).join('\n')}

Provide a structured analysis focusing on legal strategy and case management.

Respond with ONLY valid JSON matching this exact structure:
{
  "executiveSummary": "string",
  "keyIssues": ["string"],
  "currentStatus": "string",
  "nextSteps": ["string"],
  "timeline": [
    {
      "date": "string",
      "event": "string",
      "significance": "string"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["string"]
  }
}

No markdown formatting, no explanations outside the JSON. Return only the JSON object.`;

      const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
      });

      const rawJson = response.message.content.trim();
      if (!rawJson) {
        throw new Error("Empty response from AI model");
      }

      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as CaseSummaryResult;
    } catch (error) {
      console.error("Error generating case summary:", error);
      throw new Error(`Failed to generate case summary: ${error}`);
    }
  }

  /**
   * Intelligent search across matters, documents, and entities
   */
  async performSmartSearch(query: string, context: {
    matters: Matter[];
    documents: File[];
    parties: any[];
  }): Promise<SmartSearchResult[]> {
    try {
      const prompt = `You are an intelligent legal search assistant. Analyze the user's natural language query and rank relevant legal entities by relevance.

Consider:
1. Semantic similarity
2. Legal context
3. Entity relationships
4. Practical relevance

Return ranked results with relevance scores.

Search query: "${query}"

AVAILABLE MATTERS:
${context.matters.map(m => `ID: ${m.id}, Case: ${m.caseNo}, Title: ${m.title}, Stage: ${m.stage}, Subject: ${m.subject}`).join('\n')}

AVAILABLE DOCUMENTS:
${context.documents.map(d => `ID: ${d.id}, Name: ${d.name}, Category: ${d.category}, Matter: ${d.matterId}`).join('\n')}

AVAILABLE PARTIES:
${context.parties.map(p => `ID: ${p.id}, Name: ${p.name}, Role: ${p.role}, Type: ${p.type}`).join('\n')}

Rank and return the most relevant results with explanations.

Respond with ONLY valid JSON matching this exact structure:
{
  "results": [
    {
      "type": "matter|party|document|task",
      "id": "string",
      "title": "string",
      "summary": "string",
      "relevanceScore": 0.0-1.0,
      "metadata": {}
    }
  ]
}

No markdown formatting, no explanations outside the JSON. Return only the JSON object.`;

      const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
      });

      const rawJson = response.message.content.trim();
      if (!rawJson) {
        return [];
      }

      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.results || [];
    } catch (error) {
      console.error("Error performing smart search:", error);
      return [];
    }
  }

  /**
   * Generate insights for today's dashboard
   */
  async generateDashboardInsights(data: {
    todaysHearings: any[];
    pendingTasks: any[];
    recentAlerts: any[];
    activeMatters: Matter[];
  }): Promise<{
    insights: {
      type: "priority" | "deadline" | "opportunity" | "risk";
      title: string;
      message: string;
      actionUrl?: string;
      urgency: "low" | "medium" | "high";
    }[];
  }> {
    try {
      const prompt = `You are a legal practice management AI assistant. Analyze the practice data and provide actionable insights for today's dashboard.

Focus on:
1. Priority actions needed
2. Upcoming deadlines
3. Risk mitigation
4. Opportunities for efficiency

Provide 2-4 concise, actionable insights.

Analyze today's practice data:

TODAY'S HEARINGS (${data.todaysHearings.length}):
${data.todaysHearings.map(h => `${h.time} - ${h.matter?.caseNo} - ${h.purpose}`).join('\n')}

PENDING TASKS (${data.pendingTasks.length}):
${data.pendingTasks.slice(0, 5).map(t => `${t.title} - Due: ${t.dueDate} - Priority: ${t.priority}`).join('\n')}

RECENT ALERTS (${data.recentAlerts.length}):
${data.recentAlerts.slice(0, 3).map(a => `${a.type}: ${a.title} - ${a.urgency}`).join('\n')}

ACTIVE MATTERS: ${data.activeMatters.length} total

Generate actionable insights for the lawyer's attention.

Respond with ONLY valid JSON matching this exact structure:
{
  "insights": [
    {
      "type": "priority|deadline|opportunity|risk",
      "title": "string",
      "message": "string",
      "actionUrl": "string (optional)",
      "urgency": "low|medium|high"
    }
  ]
}

No markdown formatting, no explanations outside the JSON. Return only the JSON object.`;

      const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
      });

      const rawJson = response.message.content.trim();
      if (!rawJson) {
        return { insights: [] };
      }

      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error generating dashboard insights:", error);
      return { insights: [] };
    }
  }

  /**
   * Extract action items from court orders or documents
   */
  async extractActionItems(documentContent: string): Promise<{
    actionItems: {
      item: string;
      dueDate?: string;
      priority: "low" | "medium" | "high";
      category: string;
    }[];
    deadlines: {
      date: string;
      description: string;
      type: string;
    }[];
  }> {
    try {
      const prompt = `Extract actionable items and deadlines from this legal document:

${documentContent}

Identify:
1. Specific actions required
2. Filing deadlines
3. Compliance requirements
4. Next hearing preparations

Categorize by priority and type.

Respond with ONLY valid JSON matching this exact structure:
{
  "actionItems": [
    {
      "item": "string",
      "dueDate": "string (optional)",
      "priority": "low|medium|high",
      "category": "string"
    }
  ],
  "deadlines": [
    {
      "date": "string",
      "description": "string",
      "type": "string"
    }
  ]
}

No markdown formatting, no explanations outside the JSON. Return only the JSON object.`;

      const response = await ollama.chat({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false,
      });

      const rawJson = response.message.content.trim();
      if (!rawJson) {
        return { actionItems: [], deadlines: [] };
      }

      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error extracting action items:", error);
      return { actionItems: [], deadlines: [] };
    }
  }
}

export const aiAgentService = new AIAgentService();
