import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAiAnalysis } from "@/hooks/use-ai-analysis";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/date-utils";

export default function AiAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [selectedMatter, setSelectedMatter] = useState("");
  const [analysisType, setAnalysisType] = useState<"document" | "case_summary" | "smart_search">("document");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: matters = [] } = useQuery({
    queryKey: ["/api/matters"],
  });

  const { data: analysisResults = [] } = useQuery({
    queryKey: ["/api/ai-analysis-results"],
  });

  const { analyzeDocument, generateCaseSummary, performSmartSearch } = useAiAnalysis();

  const analyzeDocumentMutation = useMutation({
    mutationFn: async (data: { content: string; name?: string; matterId?: string }) => {
      return analyzeDocument.mutateAsync(data);
    },
    onSuccess: (result) => {
      toast({
        title: "Analysis Complete",
        description: "Document has been successfully analyzed by AI.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Read file content for text files
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDocumentContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (analysisType === "document" && (documentContent || selectedFile)) {
      analyzeDocumentMutation.mutate({
        content: documentContent,
        name: selectedFile?.name,
        matterId: selectedMatter || undefined,
      });
    } else if (analysisType === "case_summary" && selectedMatter) {
      generateCaseSummary.mutate({ matterId: selectedMatter });
    } else if (analysisType === "smart_search" && searchQuery) {
      performSmartSearch.mutate({ query: searchQuery });
    }
  };

  const renderAnalysisResult = (result: any) => {
    const analysis = typeof result.extractedData === 'string' 
      ? JSON.parse(result.extractedData) 
      : result.extractedData;

    if (result.type === "document_analysis") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Document Type</h4>
            <p className="text-muted-foreground">{analysis.documentType}</p>
          </div>
          
          {analysis.keyDates?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Key Dates</h4>
              <div className="space-y-2">
                {analysis.keyDates.map((date: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 text-sm">
                    <Badge variant={date.type === "deadline" ? "destructive" : "outline"}>
                      {date.type}
                    </Badge>
                    <span className="font-medium">{date.date}</span>
                    <span className="text-muted-foreground">{date.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.actionItems?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Action Items</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {analysis.actionItems.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-2">AI Summary</h4>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Badge variant={
                analysis.urgency === "critical" ? "destructive" :
                analysis.urgency === "high" ? "destructive" :
                analysis.urgency === "medium" ? "outline" : "secondary"
              }>
                {analysis.urgency} priority
              </Badge>
              <span className="text-xs text-muted-foreground">
                Confidence: {Math.round((analysis.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      );
    } else if (result.type === "case_summary") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Executive Summary</h4>
            <p className="text-sm text-muted-foreground">{analysis.executiveSummary}</p>
          </div>

          {analysis.keyIssues?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Key Issues</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {analysis.keyIssues.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-2">Current Status</h4>
            <p className="text-sm text-muted-foreground">{analysis.currentStatus}</p>
          </div>

          {analysis.nextSteps?.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Next Steps</h4>
              <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {analysis.nextSteps.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.riskAssessment && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Risk Assessment</h4>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={
                  analysis.riskAssessment.level === "high" ? "destructive" :
                  analysis.riskAssessment.level === "medium" ? "outline" : "secondary"
                }>
                  {analysis.riskAssessment.level} risk
                </Badge>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {analysis.riskAssessment.factors?.map((factor: string, idx: number) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <h4 className="font-semibold text-foreground mb-2">Analysis Result</h4>
        <p className="text-sm text-muted-foreground">{result.response}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="ai-analysis-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Document Analysis</h1>
          <p className="text-muted-foreground mt-1">Leverage AI to analyze legal documents and generate insights</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="outline">Powered by Gemini 2.5 Pro</Badge>
          <Button variant="outline" data-testid="button-view-usage">
            <i className="fas fa-chart-line mr-2"></i>
            View Usage
          </Button>
        </div>
      </div>

      {/* AI Analysis Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Input */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="document" data-testid="tab-document-analysis">
                    Document Analysis
                  </TabsTrigger>
                  <TabsTrigger value="case_summary" data-testid="tab-case-summary">
                    Case Summary
                  </TabsTrigger>
                  <TabsTrigger value="smart_search" data-testid="tab-smart-search">
                    Smart Search
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="document" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Document</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your document here, or click to browse
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        data-testid="input-file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer">
                          Select File
                        </Button>
                      </label>
                      {selectedFile && (
                        <p className="text-sm text-foreground mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Or Paste Document Text</label>
                    <Textarea
                      placeholder="Paste your document content here..."
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      rows={8}
                      data-testid="textarea-document-content"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Associate with Matter (Optional)</label>
                    <Select value={selectedMatter} onValueChange={setSelectedMatter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select matter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific matter</SelectItem>
                        {matters.map((matter: any) => (
                          <SelectItem key={matter.id} value={matter.id}>
                            {matter.caseNo} - {matter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="case_summary" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Matter for Summary</label>
                    <Select value={selectedMatter} onValueChange={setSelectedMatter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select matter" />
                      </SelectTrigger>
                      <SelectContent>
                        {matters.map((matter: any) => (
                          <SelectItem key={matter.id} value={matter.id}>
                            {matter.caseNo} - {matter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate a comprehensive AI-powered summary of the selected matter including case status, 
                    key issues, timeline, and risk assessment.
                  </p>
                </TabsContent>

                <TabsContent value="smart_search" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Query</label>
                    <Input
                      placeholder="Ask about your cases, parties, or documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-query"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use natural language to search across your matters, parties, and documents. 
                    AI will understand context and provide relevant results.
                  </p>
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleAnalyze}
                disabled={
                  analyzeDocumentMutation.isPending || 
                  generateCaseSummary.isPending || 
                  performSmartSearch.isPending ||
                  (analysisType === "document" && !documentContent && !selectedFile) ||
                  (analysisType === "case_summary" && !selectedMatter) ||
                  (analysisType === "smart_search" && !searchQuery)
                }
                className="w-full"
                data-testid="button-analyze"
              >
                {analyzeDocumentMutation.isPending || generateCaseSummary.isPending || performSmartSearch.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Start AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResults.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-robot text-3xl text-muted-foreground mb-2"></i>
                  <p className="text-sm text-muted-foreground">No analysis results yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisResults.slice(0, 5).map((result: any) => (
                    <Card key={result.id} className="p-3 cursor-pointer hover:bg-muted/50 transition">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-alt text-accent text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {result.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(result.createdAt)}
                          </p>
                          {result.confidence && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: {Math.round(result.confidence * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Results */}
      {(analyzeDocumentMutation.data || generateCaseSummary.data || performSmartSearch.data) && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {analyzeDocumentMutation.data && renderAnalysisResult({
              type: "document_analysis",
              extractedData: analyzeDocumentMutation.data
            })}
            {generateCaseSummary.data && renderAnalysisResult({
              type: "case_summary",
              extractedData: generateCaseSummary.data
            })}
            {performSmartSearch.data && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Search Results</h4>
                {performSmartSearch.data.map((result: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Badge variant="outline">{result.type}</Badge>
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground">{result.title}</h5>
                        <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Relevance: {Math.round(result.relevanceScore * 100)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
