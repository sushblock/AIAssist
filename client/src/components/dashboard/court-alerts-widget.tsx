import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

export default function CourtAlertsWidget() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/court-alerts"],
    refetchInterval: 30000,
  });

  const pendingAlerts = alerts.filter((alert: any) => !alert.resolvedAt);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "deadline_approaching": return "fas fa-exclamation";
      case "hearing_scheduled": return "fas fa-calendar-plus";
      case "order_uploaded": return "fas fa-file-upload";
      case "causelist_updated": return "fas fa-list-alt";
      default: return "fas fa-bell";
    }
  };

  const getAlertColor = (urgency: string) => {
    switch (urgency) {
      case "critical": case "high": return "text-destructive";
      case "medium": return "text-warning";
      default: return "text-primary";
    }
  };

  return (
    <Card data-testid="court-alerts-widget">
      <CardHeader className="pb-3 bg-destructive/5">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-foreground flex items-center">
            <i className="fas fa-bell text-destructive mr-2"></i>
            Court Alerts
          </CardTitle>
          <Badge variant="destructive">{pendingAlerts.length} New</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {pendingAlerts.length === 0 ? (
            <div className="p-6 text-center">
              <i className="fas fa-check-circle text-3xl text-success mb-2"></i>
              <p className="text-sm text-muted-foreground">No pending alerts</p>
            </div>
          ) : (
            pendingAlerts.slice(0, 3).map((alert: any) => (
              <div key={alert.id} className="p-4" data-testid={`alert-${alert.id}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.urgency === "high" || alert.urgency === "critical" 
                      ? "bg-destructive/10" 
                      : alert.urgency === "medium" 
                      ? "bg-warning/10" 
                      : "bg-primary/10"
                  }`}>
                    <i className={`${getAlertIcon(alert.type)} ${getAlertColor(alert.urgency)} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        <i className="fas fa-clock mr-1"></i>
                        {formatDate(alert.createdAt)}
                      </p>
                      {alert.actionRequired && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-primary hover:underline"
                          data-testid={`button-view-alert-${alert.id}`}
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {pendingAlerts.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm text-primary hover:underline"
              data-testid="button-view-all-alerts"
            >
              View All Alerts →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
