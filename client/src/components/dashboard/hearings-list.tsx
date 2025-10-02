import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatDate } from "@/lib/date-utils";

export default function HearingsList() {
  const { data: hearings = [], isLoading } = useQuery({
    queryKey: ["/api/hearings/today"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="hearings-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Today's Hearings</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-hearings">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {hearings.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-calendar-check text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No hearings today</h3>
              <p className="text-muted-foreground">Enjoy your day or catch up on pending work!</p>
            </div>
          ) : (
            hearings.map((hearing: any) => (
              <div 
                key={hearing.id} 
                className="p-6 hover:bg-muted/50 transition cursor-pointer"
                data-testid={`hearing-${hearing.id}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-center flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatTime(hearing.date).hour}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(hearing.date).period}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground font-mono">
                          {hearing.matter?.caseNo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {hearing.matter?.title}
                        </p>
                      </div>
                      <Badge variant={
                        hearing.purpose?.toLowerCase().includes("urgent") ? "destructive" :
                        hearing.purpose?.toLowerCase().includes("final") ? "default" :
                        "secondary"
                      }>
                        {hearing.purpose?.toLowerCase().includes("urgent") ? "Urgent" :
                         hearing.purpose?.toLowerCase().includes("final") ? "Final" :
                         "Regular"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <i className="fas fa-university w-5"></i>
                        <span>{hearing.court} - {hearing.bench}, {hearing.judge}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <i className="fas fa-file-alt w-5"></i>
                        <span>Purpose: {hearing.purpose}</span>
                      </div>
                      {hearing.matter?.leadCounsel && (
                        <div className="flex items-center text-sm text-foreground font-medium mt-2">
                          <i className="fas fa-robot w-5 text-accent"></i>
                          <span>AI Summary Ready</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 text-xs text-primary hover:underline"
                            data-testid={`button-ai-summary-${hearing.id}`}
                          >
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
