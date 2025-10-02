import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/date-utils";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["/api/files"],
  });

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
