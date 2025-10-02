import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";

export default function CourtAlerts() {
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/court-alerts"],
    refetchInterval: 30000,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PUT", `/api/court-alerts/${alertId}/resolve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-alerts"] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredAlerts = alerts.filter((alert: any) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = urgencyFilter === "all" || alert.urgency === urgencyFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    return matchesSearch && matchesUrgency && matchesType;
  });

  const unresolvedAlerts = filteredAlerts.filter((alert: any) => !alert.resolvedAt);
  const resolvedAlerts = filteredAlerts.filter((alert: any) => alert.resolvedAt);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "text-destructive";
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "outline";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "hearing_scheduled": return "fas fa-calendar-plus";
      case "order_uploaded": return "fas fa-file-upload";
      case "deadline_approaching": return "fas fa-clock";
      case "causelist_updated": return "fas fa-list-alt";
      default: return "fas fa-bell";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="alerts-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="skeleton h-6 w-32 mb-2"></div>
              <div className="skeleton h-4 w-64 mb-2"></div>
              <div className="skeleton h-4 w-48"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="court-alerts-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Court Alerts</h1>
          <p className="text-muted-foreground mt-1">Monitor case updates and deadlines</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" data-testid="button-refresh-alerts">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Alerts
          </Button>
          <Button data-testid="button-check-ecourts">
            <i className="fas fa-search mr-2"></i>
            Check eCourts
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{unresolvedAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Pending Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {unresolvedAlerts.filter((a: any) => a.urgency === "high" || a.urgency === "critical").length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {unresolvedAlerts.filter((a: any) => a.type === "deadline_approaching").length}
            </div>
            <div className="text-sm text-muted-foreground">Deadlines</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{resolvedAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Resolved Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-alerts"
          />
        </div>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deadline_approaching">Deadlines</SelectItem>
            <SelectItem value="hearing_scheduled">Hearings</SelectItem>
            <SelectItem value="order_uploaded">Orders</SelectItem>
            <SelectItem value="causelist_updated">Cause Lists</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({unresolvedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved">
            Resolved ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {unresolvedAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <i className="fas fa-check-circle text-4xl text-success mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending alerts at the moment.</p>
            </Card>
          ) : (
            unresolvedAlerts.map((alert: any) => (
              <Card key={alert.id} className="hover:shadow-md transition-shadow" data-testid={`alert-card-${alert.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.urgency === "critical" || alert.urgency === "high" 
                          ? "bg-destructive/10" 
                          : alert.urgency === "medium" 
                          ? "bg-warning/10" 
                          : "bg-primary/10"
                      }`}>
                        <i className={`${getAlertIcon(alert.type)} text-xl ${getUrgencyColor(alert.urgency)}`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-foreground">{alert.title}</h3>
                          <Badge variant={getUrgencyBadgeVariant(alert.urgency)}>
                            {alert.urgency}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="outline">Action Required</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            <i className="fas fa-clock mr-1"></i>
                            {formatDate(alert.createdAt)}
                          </span>
                          <span>
                            <i className="fas fa-tag mr-1"></i>
                            {alert.source}
                          </span>
                          {alert.dueDate && (
                            <span className="text-warning font-medium">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              Due: {formatDate(alert.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.actionRequired && (
                        <Button variant="outline" size="sm" data-testid={`button-take-action-${alert.id}`}>
                          <i className="fas fa-play mr-1"></i>
                          Take Action
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        <i className="fas fa-check mr-1"></i>
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <i className="fas fa-history text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No resolved alerts</h3>
              <p className="text-muted-foreground">Resolved alerts will appear here.</p>
            </Card>
          ) : (
            resolvedAlerts.map((alert: any) => (
              <Card key={alert.id} className="opacity-75" data-testid={`resolved-alert-${alert.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-xl text-success"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <Badge variant="secondary">Resolved</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          Created: {formatDate(alert.createdAt)}
                        </span>
                        <span>
                          <i className="fas fa-check mr-1"></i>
                          Resolved: {formatDate(alert.resolvedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
