import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

export default function AIDocumentAnalysis() {
  const { data: recentAnalysis = [] } = useQuery({
    queryKey: ["/api/ai-analysis-results"],
  });

  const handleFileSelect = () => {
    // This would open a file dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle file upload and analysis
        console.log('File selected:', file.name);
      }
    };
    input.click();
  };

  return (
    <Card className="p-6 border-2 border-primary/30" data-testid="ai-document-analysis">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">AI Document Analysis</h2>
                <p className="text-sm text-muted-foreground">Powered by Local AI (Ollama) - Agentic Workflow</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Upload court orders, petitions, or legal documents for instant AI-powered analysis. 
              The system automatically extracts key dates, identifies action items, and generates summaries.
            </p>

            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition cursor-pointer"
              onClick={handleFileSelect}
              data-testid="upload-drop-zone"
            >
              <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-3"></i>
              <p className="text-foreground font-medium mb-1">Drop your document here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, DOCX, JPG - Max 10MB</p>
              <Button className="mt-4" data-testid="button-select-document">
                <i className="fas fa-file-upload mr-2"></i>
                Select Document
              </Button>
            </div>

            {/* Recent Analysis */}
            <div className="mt-6">
              <h3 className="font-semibold text-foreground mb-3">Recent Analysis</h3>
              <div className="space-y-2">
                {recentAnalysis.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No analysis history yet</p>
                  </div>
                ) : (
                  recentAnalysis.slice(0, 3).map((analysis: any) => (
                    <div 
                      key={analysis.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition cursor-pointer"
                      data-testid={`analysis-item-${analysis.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-file-pdf text-destructive text-xl"></i>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {analysis.type.replace('_', ' ')} Analysis
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Analyzed {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:underline text-sm"
                        data-testid={`button-view-analysis-${analysis.id}`}
                      >
                        View Report
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sample AI Analysis Result */}
          <div className="lg:w-96 mt-6 lg:mt-0">
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">Sample Analysis</h4>
                  <Badge variant="default">Complete</Badge>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Document Type</p>
                    <p className="text-foreground">Court Order - Interim Application</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Key Dates Extracted</p>
                    <div className="space-y-1">
                      <div className="flex items-center text-foreground">
                        <i className="fas fa-calendar text-warning mr-2"></i>
                        <span>Next Hearing: Jan 28, 2025</span>
                      </div>
                      <div className="flex items-center text-foreground">
                        <i className="fas fa-calendar text-destructive mr-2"></i>
                        <span>Reply Due: Jan 17, 2025</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Action Items</p>
                    <ul className="space-y-1 list-disc list-inside text-foreground">
                      <li>File reply affidavit</li>
                      <li>Serve notice to respondents</li>
                      <li>Submit proof of service</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-muted-foreground font-medium mb-1">AI Summary</p>
                    <p className="text-foreground text-xs leading-relaxed">
                      Court has granted interim relief preventing the respondent from alienating the property. 
                      Notice issued to respondents. Matter adjourned to allow parties to file replies.
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4" data-testid="button-view-full-analysis">
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
