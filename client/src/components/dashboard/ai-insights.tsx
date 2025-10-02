import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/dashboard/insights"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6 border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="p-0">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-2xl" style={{ color: "hsl(var(--accent-foreground))" }}></i>
            </div>
            <div className="flex-1">
              <div className="skeleton h-6 w-48 mb-2"></div>
              <div className="skeleton h-4 w-96 mb-4"></div>
              <div className="space-y-3">
                <div className="skeleton h-16 w-full"></div>
                <div className="skeleton h-16 w-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights?.insights?.length) {
    return (
      <Card className="p-6 border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="p-0">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-2xl" style={{ color: "hsl(var(--accent-foreground))" }}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">AI-Powered Insights</h3>
                <Badge variant="outline">Powered by Gemini</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your intelligent assistant is analyzing your practice data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent" data-testid="ai-insights">
      <CardContent className="p-0">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-2xl" style={{ color: "hsl(var(--accent-foreground))" }}></i>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">AI-Powered Insights</h3>
              <Badge variant="outline">Powered by Gemini</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your intelligent assistant has analyzed today's schedule and documents
            </p>
            
            <div className="space-y-3">
              {insights.insights.map((insight: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 bg-card/50 p-3 rounded-md"
                  data-testid={`insight-${index}`}
                >
                  <i className={`fas ${
                    insight.type === 'priority' ? 'fa-lightbulb text-accent' :
                    insight.type === 'deadline' ? 'fa-clock text-warning' :
                    insight.type === 'risk' ? 'fa-exclamation-triangle text-destructive' :
                    'fa-calendar-check text-success'
                  } mt-1`}></i>
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                    {insight.actionUrl && (
                      <button className="text-xs text-primary hover:underline mt-1">
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
