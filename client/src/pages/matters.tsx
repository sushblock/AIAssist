import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMatterSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";

const matterFormSchema = insertMatterSchema.extend({
  nextHearingDate: z.string().optional(),
  filingDate: z.string().optional(),
});

export default function Matters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: matters = [], isLoading } = useQuery({
    queryKey: ["/api/matters"],
    refetchInterval: 30000,
  });

  const createMatterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof matterFormSchema>) => {
      const response = await apiRequest("POST", "/api/matters", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matters"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Matter Created",
        description: "New matter has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create matter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof matterFormSchema>>({
    resolver: zodResolver(matterFormSchema),
    defaultValues: {
      caseNo: "",
      title: "",
      court: "",
      forum: "",
      subject: "",
      stage: "filing",
      status: "active",
      priority: "medium",
    },
  });

  const filteredMatters = matters.filter((matter: any) => {
    const matchesSearch = matter.caseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         matter.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || matter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = (data: z.infer<typeof matterFormSchema>) => {
    createMatterMutation.mutate(data);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "closed": return "secondary";
      case "pending": return "outline";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="matters-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="skeleton h-6 w-32 mb-2"></div>
              <div className="skeleton h-4 w-64 mb-4"></div>
              <div className="flex space-x-2">
                <div className="skeleton h-6 w-20"></div>
                <div className="skeleton h-6 w-24"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="matters-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matters</h1>
          <p className="text-muted-foreground mt-1">Manage your legal cases and proceedings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-matter">
              <i className="fas fa-plus mr-2"></i>
              New Matter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Matter</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Number</FormLabel>
                        <FormControl>
                          <Input placeholder="CS 123/2025" {...field} data-testid="input-case-no" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filingNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filing Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12345/2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matter Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Petitioner vs. Respondent" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="court"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Court</FormLabel>
                        <FormControl>
                          <Input placeholder="Delhi High Court" {...field} data-testid="input-court" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="forum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forum</FormLabel>
                        <FormControl>
                          <Input placeholder="Civil Side" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the matter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="filing">Filing</SelectItem>
                            <SelectItem value="notice">Notice Stage</SelectItem>
                            <SelectItem value="evidence">Evidence</SelectItem>
                            <SelectItem value="arguments">Arguments</SelectItem>
                            <SelectItem value="judgment">Judgment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMatterMutation.isPending}
                    data-testid="button-submit-matter"
                  >
                    {createMatterMutation.isPending ? "Creating..." : "Create Matter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input
            placeholder="Search matters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-matters"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{matters.length}</div>
            <div className="text-sm text-muted-foreground">Total Matters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {matters.filter((m: any) => m.status === "active").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {matters.filter((m: any) => m.priority === "high").length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {matters.filter((m: any) => m.nextHearingDate && new Date(m.nextHearingDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-sm text-muted-foreground">Due This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Matters List */}
      <div className="space-y-4">
        {filteredMatters.length === 0 ? (
          <Card className="p-12 text-center">
            <i className="fas fa-briefcase text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-semibold text-foreground mb-2">No matters found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Create your first matter to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <i className="fas fa-plus mr-2"></i>
                Create Matter
              </Button>
            )}
          </Card>
        ) : (
          filteredMatters.map((matter: any) => (
            <Card key={matter.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`matter-card-${matter.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground font-mono">{matter.caseNo}</h3>
                      <Badge variant={getStatusBadgeVariant(matter.status)}>{matter.status}</Badge>
                      <i className={`fas fa-circle text-xs ${getPriorityColor(matter.priority)}`}></i>
                    </div>
                    <p className="text-foreground font-medium mb-1">{matter.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span><i className="fas fa-university mr-1"></i>{matter.court}</span>
                      <span><i className="fas fa-layer-group mr-1"></i>{matter.stage}</span>
                      {matter.nextHearingDate && (
                        <span><i className="fas fa-calendar mr-1"></i>{formatDate(matter.nextHearingDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" data-testid={`button-view-${matter.id}`}>
                      <i className="fas fa-eye mr-1"></i>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-ai-summary-${matter.id}`}>
                      <i className="fas fa-robot mr-1"></i>
                      AI Summary
                    </Button>
                  </div>
                </div>
                
                {matter.subject && (
                  <p className="text-sm text-muted-foreground mb-3">{matter.subject}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Filed: {matter.filingDate ? formatDate(matter.filingDate) : 'N/A'}</span>
                  <span>•</span>
                  <span>Updated: {formatDate(matter.updatedAt)}</span>
                  {matter.tags && matter.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex space-x-1">
                        {matter.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
