import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

export function useAiAnalysis() {
  const queryClient = useQueryClient();

  const analyzeDocument = useMutation({
    mutationFn: async (data: {
      content: string;
      name?: string;
      matterId?: string;
    }): Promise<DocumentAnalysisResult> => {
      const response = await apiRequest("POST", "/api/ai/analyze-document", {
        documentContent: data.content,
        documentName: data.name,
        matterId: data.matterId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-analysis-results"] });
    },
  });

  const generateCaseSummary = useMutation({
    mutationFn: async (data: { matterId: string }): Promise<CaseSummaryResult> => {
      const response = await apiRequest("POST", "/api/ai/generate-case-summary", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-analysis-results"] });
    },
  });

  const performSmartSearch = useMutation({
    mutationFn: async (data: { query: string }): Promise<SmartSearchResult[]> => {
      const response = await apiRequest("POST", "/api/ai/smart-search", data);
      return response.json();
    },
  });

  const extractActionItems = useMutation({
    mutationFn: async (documentContent: string) => {
      const response = await apiRequest("POST", "/api/ai/extract-action-items", {
        documentContent,
      });
      return response.json();
    },
  });

  const useAnalysisResults = () => useQuery({
    queryKey: ["/api/ai-analysis-results"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    analyzeDocument,
    generateCaseSummary,
    performSmartSearch,
    extractActionItems,
    useAnalysisResults,
  };
}
