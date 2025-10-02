import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPartySchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const partyFormSchema = insertPartySchema.omit({ orgId: true });

export default function Parties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["/api/parties"],
  });

  const { data: matters = [] } = useQuery({
    queryKey: ["/api/matters"],
  });

  const createPartyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof partyFormSchema>) => {
      const response = await apiRequest("POST", "/api/parties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Party Created",
        description: "New party has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create party. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof partyFormSchema>>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      name: "",
      role: "petitioner",
      type: "client",
      email: "",
      phone: "",
      address: "",
    },
  });

  const filteredParties = parties.filter((party: any) => {
    const matchesSearch = party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         party.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         party.phone?.includes(searchQuery);
    const matchesType = typeFilter === "all" || party.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const onSubmit = (data: z.infer<typeof partyFormSchema>) => {
    createPartyMutation.mutate(data);
  };

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
      <div className="space-y-6" data-testid="parties-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-24 mb-2"></div>
              <div className="skeleton h-4 w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-36"></div>
                <div className="skeleton h-3 w-28"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="parties-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parties & Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage clients, opposing parties, and advocates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-party">
              <i className="fas fa-user-plus mr-2"></i>
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="opposing">Opposing Party</SelectItem>
                            <SelectItem value="witness">Witness</SelectItem>
                            <SelectItem value="advocate">Advocate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role in Matter</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="petitioner">Petitioner</SelectItem>
                            <SelectItem value="respondent">Respondent</SelectItem>
                            <SelectItem value="appellant">Appellant</SelectItem>
                            <SelectItem value="intervener">Intervener</SelectItem>
                            <SelectItem value="witness">Witness</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="matterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Matter (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select matter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No specific matter</SelectItem>
                          {matters.map((matter: any) => (
                            <SelectItem key={matter.id} value={matter.id}>
                              {matter.caseNo} - {matter.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCDE1234F" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aadharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234 5678 9012" {...field} />
                        </FormControl>
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
                    disabled={createPartyMutation.isPending}
                    data-testid="button-submit-party"
                  >
                    {createPartyMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{parties.length}</div>
            <div className="text-sm text-muted-foreground">Total Contacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {parties.filter((p: any) => p.type === "client").length}
            </div>
            <div className="text-sm text-muted-foreground">Clients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {parties.filter((p: any) => p.type === "opposing").length}
            </div>
            <div className="text-sm text-muted-foreground">Opposing Parties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {parties.filter((p: any) => p.type === "advocate").length}
            </div>
            <div className="text-sm text-muted-foreground">Advocates</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-parties"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="opposing">Opposing Parties</SelectItem>
            <SelectItem value="witness">Witnesses</SelectItem>
            <SelectItem value="advocate">Advocates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || typeFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Add your first contact to get started"}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <i className="fas fa-user-plus mr-2"></i>
                  Add Contact
                </Button>
              )}
            </Card>
          </div>
        ) : (
          filteredParties.map((party: any) => (
            <Card key={party.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`party-card-${party.id}`}>
              <CardContent className="p-6">
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
                        <Button variant="ghost" size="sm" className="text-xs" data-testid={`button-send-update-${party.id}`}>
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
    </div>
  );
}
