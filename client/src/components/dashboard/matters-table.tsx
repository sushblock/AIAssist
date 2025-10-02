import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

export default function MattersTable() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: matters = [], isLoading } = useQuery({
    queryKey: ["/api/matters"],
  });

  const filteredMatters = matters
    .filter((matter: any) => 
      matter.caseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matter.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 4); // Show only first 4 for dashboard

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
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="skeleton h-96 w-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="matters-table">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <CardTitle className="text-xl">Active Matters</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your case portfolio</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-64">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm"></i>
              <Input 
                type="text" 
                placeholder="Filter matters..." 
                className="pl-9 text-sm" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-filter-matters"
              />
            </div>
            <Button variant="outline" size="sm" data-testid="button-show-filters">
              <i className="fas fa-filter mr-2"></i>
              Filters
            </Button>
            <Button size="sm" data-testid="button-new-matter">
              <i className="fas fa-plus mr-2"></i>
              <span className="hidden md:inline">New Matter</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Matter
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Court/Forum
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Stage
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                  Next Hearing
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
              {filteredMatters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-briefcase text-4xl text-muted-foreground mb-4"></i>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No matters found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search" : "Create your first matter to get started"}
                      </p>
                      {!searchQuery && (
                        <Button data-testid="button-create-first-matter">
                          <i className="fas fa-plus mr-2"></i>
                          Create Matter
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMatters.map((matter: any) => (
                  <tr 
                    key={matter.id} 
                    className="hover:bg-muted/30 transition cursor-pointer"
                    data-testid={`matter-row-${matter.id}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground font-mono text-sm">
                          {matter.caseNo}
                        </p>
                        <p className="text-sm text-muted-foreground">{matter.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <i className="fas fa-university mr-2"></i>
                        <span>{matter.court}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{matter.stage}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {matter.nextHearingDate ? (
                        <div className="text-sm">
                          <p className="text-foreground font-medium">
                            {formatDate(matter.nextHearingDate)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(matter.nextHearingDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(matter.status)}>
                          {matter.status}
                        </Badge>
                        {matter.priority === "high" && (
                          <i className={`fas fa-circle text-xs ${getPriorityColor(matter.priority)}`}></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-view-matter-${matter.id}`}
                        >
                          <i className="fas fa-eye mr-1"></i>
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-ai-summary-matter-${matter.id}`}
                        >
                          <i className="fas fa-robot mr-1"></i>
                          AI
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-more-options-${matter.id}`}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredMatters.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredMatters.length} of {matters.length} matters
            </p>
            <Button variant="ghost" size="sm" data-testid="button-view-all-matters">
              View All Matters →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
