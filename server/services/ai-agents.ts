import { GoogleGenAI } from "@google/genai";
import type { Matter, File, Docket } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocumentAnalysisResult {
  documentType: string;
  keyDates: {
    date: string;
    type: string; // "hearing", "deadline", "order_date"
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
   * Analyze a legal document using Gemini AI
   */
  async analyzeDocument(documentContent: string, documentName?: string): Promise<DocumentAnalysisResult> {
    try {
      const systemPrompt = `You are an expert legal document analyzer. Analyze the provided legal document and extract key information in a structured format.

Focus on:
1. Document type identification
2. Key dates (hearings, deadlines, order dates)
3. Action items required
4. Brief summary
5. Parties involved
6. Court details
7. Urgency level assessment

Provide analysis in JSON format with high confidence scores.`;

      const userPrompt = `Analyze this legal document:
${documentName ? `Document Name: ${documentName}\n` : ''}
Content:
${documentContent}

Extract and structure the key information.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              documentType: { type: "string" },
              keyDates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    type: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["date", "type", "description"]
                }
              },
              actionItems: {
                type: "array",
                items: { type: "string" }
              },
              summary: { type: "string" },
              parties: {
                type: "array",
                items: { type: "string" }
              },
              courtDetails: {
                type: "object",
                properties: {
                  court: { type: "string" },
                  judge: { type: "string" },
                  caseNumber: { type: "string" }
                }
              },
              urgency: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              confidence: { type: "number" }
            },
            required: ["documentType", "keyDates", "actionItems", "summary", "urgency", "confidence"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from AI model");
      }

      return JSON.parse(rawJson) as DocumentAnalysisResult;
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
      const systemPrompt = `You are an experienced legal analyst. Generate a comprehensive case summary based on the provided matter details, documents, and party information.

Provide:
1. Executive summary
2. Key legal issues
3. Current status
4. Recommended next steps
5. Timeline of significant events
6. Risk assessment

Be concise but thorough, focusing on actionable insights.`;

      const userPrompt = `Generate a case summary for:

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

Provide a structured analysis focusing on legal strategy and case management.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string" },
              keyIssues: {
                type: "array",
                items: { type: "string" }
              },
              currentStatus: { type: "string" },
              nextSteps: {
                type: "array",
                items: { type: "string" }
              },
              timeline: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    event: { type: "string" },
                    significance: { type: "string" }
                  },
                  required: ["date", "event", "significance"]
                }
              },
              riskAssessment: {
                type: "object",
                properties: {
                  level: {
                    type: "string",
                    enum: ["low", "medium", "high"]
                  },
                  factors: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["level", "factors"]
              }
            },
            required: ["executiveSummary", "keyIssues", "currentStatus", "nextSteps", "timeline", "riskAssessment"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from AI model");
      }

      return JSON.parse(rawJson) as CaseSummaryResult;
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
      const systemPrompt = `You are an intelligent legal search assistant. Analyze the user's natural language query and rank relevant legal entities by relevance.

Consider:
1. Semantic similarity
2. Legal context
3. Entity relationships
4. Practical relevance

Return ranked results with relevance scores.`;

      const userPrompt = `Search query: "${query}"

AVAILABLE MATTERS:
${context.matters.map(m => `ID: ${m.id}, Case: ${m.caseNo}, Title: ${m.title}, Stage: ${m.stage}, Subject: ${m.subject}`).join('\n')}

AVAILABLE DOCUMENTS:
${context.documents.map(d => `ID: ${d.id}, Name: ${d.name}, Category: ${d.category}, Matter: ${d.matterId}`).join('\n')}

AVAILABLE PARTIES:
${context.parties.map(p => `ID: ${p.id}, Name: ${p.name}, Role: ${p.role}, Type: ${p.type}`).join('\n')}

Rank and return the most relevant results with explanations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["matter", "party", "document", "task"]
                    },
                    id: { type: "string" },
                    title: { type: "string" },
                    summary: { type: "string" },
                    relevanceScore: { type: "number" },
                    metadata: { type: "object" }
                  },
                  required: ["type", "id", "title", "summary", "relevanceScore"]
                }
              }
            },
            required: ["results"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        return [];
      }

      const parsed = JSON.parse(rawJson);
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
      const systemPrompt = `You are a legal practice management AI assistant. Analyze the practice data and provide actionable insights for today's dashboard.

Focus on:
1. Priority actions needed
2. Upcoming deadlines
3. Risk mitigation
4. Opportunities for efficiency

Provide 2-4 concise, actionable insights.`;

      const userPrompt = `Analyze today's practice data:

TODAY'S HEARINGS (${data.todaysHearings.length}):
${data.todaysHearings.map(h => `${h.time} - ${h.matter?.caseNo} - ${h.purpose}`).join('\n')}

PENDING TASKS (${data.pendingTasks.length}):
${data.pendingTasks.slice(0, 5).map(t => `${t.title} - Due: ${t.dueDate} - Priority: ${t.priority}`).join('\n')}

RECENT ALERTS (${data.recentAlerts.length}):
${data.recentAlerts.slice(0, 3).map(a => `${a.type}: ${a.title} - ${a.urgency}`).join('\n')}

ACTIVE MATTERS: ${data.activeMatters.length} total

Generate actionable insights for the lawyer's attention.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["priority", "deadline", "opportunity", "risk"]
                    },
                    title: { type: "string" },
                    message: { type: "string" },
                    actionUrl: { type: "string" },
                    urgency: {
                      type: "string",
                      enum: ["low", "medium", "high"]
                    }
                  },
                  required: ["type", "title", "message", "urgency"]
                }
              }
            },
            required: ["insights"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        return { insights: [] };
      }

      return JSON.parse(rawJson);
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

Categorize by priority and type.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              actionItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    item: { type: "string" },
                    dueDate: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"]
                    },
                    category: { type: "string" }
                  },
                  required: ["item", "priority", "category"]
                }
              },
              deadlines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    description: { type: "string" },
                    type: { type: "string" }
                  },
                  required: ["date", "description", "type"]
                }
              }
            },
            required: ["actionItems", "deadlines"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        return { actionItems: [], deadlines: [] };
      }

      return JSON.parse(rawJson);
    } catch (error) {
      console.error("Error extracting action items:", error);
      return { actionItems: [], deadlines: [] };
    }
  }
}

export const aiAgentService = new AIAgentService();
