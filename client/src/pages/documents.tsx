import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showBatesDialog, setShowBatesDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [batesedPdfUrl, setBatesedPdfUrl] = useState<string | null>(null);
  
  // Bates numbering form state
  const [batesPrefix, setBatesPrefix] = useState("");
  const [batesStartNumber, setBatesStartNumber] = useState("1");
  const [batesSuffix, setBatesSuffix] = useState("");
  const [batesPosition, setBatesPosition] = useState("bottom-right");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["/api/files"],
  });
  
  // Validate PDF mutation
  const validatePdfMutation = useMutation({
    mutationFn: async (pdfBase64: string) => {
      return await apiRequest("/api/pdf/validate", "POST", { pdfBase64 });
    },
    onSuccess: (data) => {
      setValidationResult(data);
      toast({
        title: data.isValid ? "✓ Validation Passed" : "✗ Validation Failed",
        description: data.isValid 
          ? "PDF meets court filing requirements" 
          : "PDF has issues that need attention",
        variant: data.isValid ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Validation Failed",
        description: "Could not validate PDF. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Add Bates numbering mutation
  const addBatesMutation = useMutation({
    mutationFn: async (params: { pdfBase64: string; prefix: string; startNumber: number; suffix: string; position: string }) => {
      return await apiRequest("/api/pdf/add-bates", "POST", params);
    },
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBatesedPdfUrl(url);
      
      toast({
        title: "✓ Bates Numbering Added",
        description: "Your PDF is ready for download",
      });
    },
    onError: () => {
      toast({
        title: "Bates Numbering Failed",
        description: "Could not add Bates numbers. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle PDF file selection for validation
  const handleValidatePdfSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedPdf(file);
      setValidationResult(null);
      setShowValidationDialog(true);
      
      // Convert to base64 and validate
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const pdfBase64 = base64.split(',')[1]; // Remove data:application/pdf;base64, prefix
        validatePdfMutation.mutate(pdfBase64);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };
  
  // Handle PDF file selection for Bates numbering
  const handleBatesPdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedPdf(file);
      setBatesedPdfUrl(null);
      setShowBatesDialog(true);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };
  
  // Apply Bates numbering
  const handleApplyBates = async () => {
    if (!selectedPdf) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const pdfBase64 = base64.split(',')[1];
      
      addBatesMutation.mutate({
        pdfBase64,
        prefix: batesPrefix,
        startNumber: parseInt(batesStartNumber) || 1,
        suffix: batesSuffix,
        position: batesPosition,
      });
    };
    reader.readAsDataURL(selectedPdf);
  };

  const filteredFiles = files.filter((file: any) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "fas fa-file-pdf text-destructive";
    if (mimeType.includes("word")) return "fas fa-file-word text-primary";
    if (mimeType.includes("image")) return "fas fa-file-image text-success";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "fas fa-file-excel text-success";
    return "fas fa-file text-muted-foreground";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="documents-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-24 mb-2"></div>
              <div className="skeleton h-4 w-32 mb-4"></div>
              <div className="skeleton h-3 w-28"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="documents-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage case files and evidence</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" data-testid="button-scan-document">
            <i className="fas fa-scanner mr-2"></i>
            Scan Document
          </Button>
          <Button data-testid="button-upload-document">
            <i className="fas fa-upload mr-2"></i>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{files.length}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {files.filter((f: any) => f.mimeType?.includes("pdf")).length}
            </div>
            <div className="text-sm text-muted-foreground">PDF Files</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {files.filter((f: any) => f.aiAnalysis).length}
            </div>
            <div className="text-sm text-muted-foreground">AI Analyzed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {Math.round(files.reduce((acc: number, f: any) => acc + (f.size || 0), 0) / 1024 / 1024)}
            </div>
            <div className="text-sm text-muted-foreground">MB Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="petition">Petitions</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="affidavit">Affidavits</SelectItem>
            <SelectItem value="evidence">Evidence</SelectItem>
            <SelectItem value="correspondence">Correspondence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition cursor-pointer" data-testid="upload-area">
        <CardContent className="p-8 text-center">
          <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-3"></i>
          <p className="text-foreground font-medium mb-1">Drop your documents here or click to browse</p>
          <p className="text-sm text-muted-foreground">Supports PDF, DOCX, JPG, PNG - Max 10MB per file</p>
          <Button className="mt-4" data-testid="button-select-files">
            <i className="fas fa-file-upload mr-2"></i>
            Select Files
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Promotion */}
      <Card className="border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-2xl" style={{ color: "hsl(var(--accent-foreground))" }}></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Document Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload legal documents for instant AI-powered analysis. Extract key dates, identify action items, 
                and generate summaries automatically.
              </p>
              <Button variant="outline" data-testid="button-try-ai-analysis">
                <i className="fas fa-magic mr-2"></i>
                Try AI Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Validation & Court Filing Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-check text-2xl text-primary-foreground"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">PDF Validation Toolkit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Validate PDFs for Indian court filing compliance. Check margins, fonts, page size, and formatting standards.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleValidatePdfSelect}
                  data-testid="input-validate-pdf"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-validate-pdf"
                >
                  <i className="fas fa-shield-check mr-2"></i>
                  Validate PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-success/30 bg-gradient-to-r from-success/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-hashtag text-2xl" style={{ color: "hsl(var(--success-foreground))" }}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Bates Numbering</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add sequential Bates numbers to PDF pages for court filing tracking and document organization.
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleBatesPdfSelect}
                  id="bates-pdf-input"
                  data-testid="input-bates-pdf"
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('bates-pdf-input')?.click()}
                  data-testid="button-add-bates"
                >
                  <i className="fas fa-sort-numeric-down mr-2"></i>
                  Add Bates Numbers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDF Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF Validation Results</DialogTitle>
            <DialogDescription>
              {selectedPdf?.name}
            </DialogDescription>
          </DialogHeader>
          
          {validatePdfMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Validating PDF...</p>
            </div>
          ) : validationResult ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-success/10 border border-success' : 'bg-destructive/10 border border-destructive'}`}>
                <div className="flex items-center space-x-2">
                  <i className={`fas ${validationResult.isValid ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-destructive'} text-2xl`}></i>
                  <div>
                    <h3 className="font-semibold">
                      {validationResult.isValid ? 'Validation Passed' : 'Validation Failed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {validationResult.isValid ? 'PDF meets court filing requirements' : 'PDF has issues that need attention'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-destructive mb-2">❌ Errors (Must Fix)</h4>
                  <ul className="space-y-1">
                    {validationResult.errors.map((error: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground pl-4">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-warning mb-2">⚠️ Warnings (Recommended)</h4>
                  <ul className="space-y-1">
                    {validationResult.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground pl-4">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Report */}
              {validationResult.reportText && (
                <div>
                  <h4 className="font-semibold mb-2">Full Report</h4>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                    {validationResult.reportText}
                  </pre>
                </div>
              )}

              <Button onClick={() => setShowValidationDialog(false)} className="w-full">
                Close
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Bates Numbering Dialog */}
      <Dialog open={showBatesDialog} onOpenChange={setShowBatesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bates Numbering</DialogTitle>
            <DialogDescription>
              Configure Bates numbering for {selectedPdf?.name}
            </DialogDescription>
          </DialogHeader>
          
          {!batesedPdfUrl ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bates-prefix">Prefix (Optional)</Label>
                <Input
                  id="bates-prefix"
                  placeholder="e.g., DOC-"
                  value={batesPrefix}
                  onChange={(e) => setBatesPrefix(e.target.value)}
                  data-testid="input-bates-prefix"
                />
              </div>

              <div>
                <Label htmlFor="bates-start">Start Number *</Label>
                <Input
                  id="bates-start"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={batesStartNumber}
                  onChange={(e) => setBatesStartNumber(e.target.value)}
                  data-testid="input-bates-start"
                />
              </div>

              <div>
                <Label htmlFor="bates-suffix">Suffix (Optional)</Label>
                <Input
                  id="bates-suffix"
                  placeholder="e.g., -PG"
                  value={batesSuffix}
                  onChange={(e) => setBatesSuffix(e.target.value)}
                  data-testid="input-bates-suffix"
                />
              </div>

              <div>
                <Label htmlFor="bates-position">Position</Label>
                <Select value={batesPosition} onValueChange={setBatesPosition}>
                  <SelectTrigger id="bates-position" data-testid="select-bates-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-center">Top Center</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleApplyBates}
                  disabled={addBatesMutation.isPending}
                  className="flex-1"
                  data-testid="button-apply-bates"
                >
                  {addBatesMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Apply Bates Numbers
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBatesDialog(false)}
                  data-testid="button-cancel-bates"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-check-circle text-success text-2xl"></i>
                  <div>
                    <h3 className="font-semibold">Bates Numbers Added!</h3>
                    <p className="text-sm text-muted-foreground">Your PDF is ready for download</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <a
                  href={batesedPdfUrl}
                  download={selectedPdf?.name?.replace('.pdf', '_bates.pdf')}
                  className="flex-1"
                >
                  <Button className="w-full" data-testid="button-download-bates">
                    <i className="fas fa-download mr-2"></i>
                    Download PDF
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBatesDialog(false);
                    setBatesedPdfUrl(null);
                  }}
                  data-testid="button-close-bates"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid" data-testid="tab-grid">
              <i className="fas fa-th mr-2"></i>
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <i className="fas fa-list mr-2"></i>
              List View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card className="p-12 text-center">
              <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Upload your first document to get started"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file: any) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`document-card-${file.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <i className={`${getFileIcon(file.mimeType)} text-2xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate mb-1">{file.originalName}</h3>
                        {file.category && (
                          <Badge variant="outline" className="text-xs mb-2">{file.category}</Badge>
                        )}
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>{formatFileSize(file.size)}</div>
                          <div>{formatDate(file.createdAt)}</div>
                        </div>
                        {file.aiAnalysis && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <i className="fas fa-robot mr-1"></i>
                              AI Analyzed
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-xs" data-testid={`button-download-${file.id}`}>
                        <i className="fas fa-download mr-1"></i>
                        Download
                      </Button>
                      {file.aiAnalysis && (
                        <Button variant="ghost" size="sm" className="text-xs" data-testid={`button-view-analysis-${file.id}`}>
                          <i className="fas fa-eye mr-1"></i>
                          View Analysis
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card className="p-12 text-center">
              <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground">Upload your first document to get started</p>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Document
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Category
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Size
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Upload Date
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Status
                        </th>
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFiles.map((file: any) => (
                        <tr key={file.id} className="hover:bg-muted/30 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <i className={`${getFileIcon(file.mimeType)} text-lg`}></i>
                              <div>
                                <p className="font-medium text-foreground">{file.originalName}</p>
                                <p className="text-xs text-muted-foreground">{file.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {file.category ? (
                              <Badge variant="outline">{file.category}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {file.aiAnalysis ? (
                              <Badge variant="secondary">
                                <i className="fas fa-robot mr-1"></i>
                                AI Analyzed
                              </Badge>
                            ) : (
                              <Badge variant="outline">Uploaded</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-download-list-${file.id}`}>
                                <i className="fas fa-download"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-analyze-${file.id}`}>
                                <i className="fas fa-robot"></i>
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-delete-${file.id}`}>
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
