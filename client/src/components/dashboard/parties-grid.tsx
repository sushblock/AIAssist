import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PartiesGrid() {
  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["/api/parties"],
  });

  const getPartyTypeColor = (type: string) => {
    switch (type) {
      case "client": return "text-primary";
      case "opposing": return "text-destructive";
      case "witness": return "text-warning";
      case "advocate": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getPartyTypeBadge = (type: string) => {
    switch (type) {
      case "client": return "default";
      case "opposing": return "destructive";
      case "witness": return "outline";
      case "advocate": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-32 w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="parties-grid">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Parties & Contacts</CardTitle>
            <p className="text-sm text-muted-foreground">Manage clients and opposing parties</p>
          </div>
          <Button data-testid="button-add-party">
            <i className="fas fa-user-plus mr-2"></i>
            Add Contact
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">Add your first contact to get started</p>
              <Button data-testid="button-add-first-contact">
                <i className="fas fa-user-plus mr-2"></i>
                Add Contact
              </Button>
            </div>
          ) : (
            parties.slice(0, 6).map((party: any) => (
              <Card 
                key={party.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                data-testid={`party-card-${party.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      party.type === "client" ? "bg-primary/10" :
                      party.type === "opposing" ? "bg-destructive/10" :
                      party.type === "advocate" ? "bg-success/10" :
                      "bg-secondary/10"
                    }`}>
                      <span className={`font-semibold ${getPartyTypeColor(party.type)}`}>
                        {party.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground truncate">{party.name}</h3>
                        <Badge variant={getPartyTypeBadge(party.type)} className="text-xs">
                          {party.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{party.role}</p>
                      
                      <div className="space-y-1 text-xs">
                        {party.phone && (
                          <div className="flex items-center text-muted-foreground">
                            <i className="fas fa-phone w-4"></i>
                            <span>{party.phone}</span>
                          </div>
                        )}
                        {party.email && (
                          <div className="flex items-center text-muted-foreground">
                            <i className="fas fa-envelope w-4"></i>
                            <span className="truncate">{party.email}</span>
                          </div>
                        )}
                      </div>

                      {party.type === "client" && (
                        <div className="mt-3 flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                            data-testid={`button-send-update-${party.id}`}
                          >
                            <i className="fas fa-paper-plane mr-1"></i>
                            Send Update
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {parties.length > 6 && (
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              className="text-sm text-primary hover:underline"
              data-testid="button-view-all-parties"
            >
              View All Contacts ({parties.length} total) →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
