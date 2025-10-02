import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/date-utils";

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
  });

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "sent": return "outline";
      case "overdue": return "destructive";
      case "draft": return "secondary";
      default: return "outline";
    }
  };

  const totalRevenue = invoices
    .filter((inv: any) => inv.status === "paid")
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || "0"), 0);

  const pendingAmount = invoices
    .filter((inv: any) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || "0"), 0);

  const thisMonthRevenue = invoices
    .filter((inv: any) => {
      const invoiceDate = new Date(inv.createdAt);
      const now = new Date();
      return inv.status === "paid" && 
             invoiceDate.getMonth() === now.getMonth() && 
             invoiceDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || "0"), 0);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="billing-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="skeleton h-6 w-24 mb-2"></div>
              <div className="skeleton h-8 w-20"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="billing-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage invoices and track revenue</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" data-testid="button-start-timer">
            <i className="fas fa-play mr-2"></i>
            Start Timer
          </Button>
          <Button data-testid="button-create-invoice">
            <i className="fas fa-file-invoice mr-2"></i>
            New Invoice
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{formatCurrency(thisMonthRevenue)}</div>
            <div className="text-sm text-muted-foreground">This Month Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{formatCurrency(pendingAmount)}</div>
            <div className="text-sm text-muted-foreground">Pending Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{invoices.length}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Timer */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <i className="fas fa-clock text-primary text-xl mt-1"></i>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Time Tracking Active</p>
              <p className="text-sm text-muted-foreground">
                Currently tracking: Document Review - CS 234/2024
                <span className="font-mono font-semibold ml-2 text-primary">01:23:45</span>
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Button size="sm" data-testid="button-stop-timer">
                  <i className="fas fa-stop mr-1"></i>
                  Stop
                </Button>
                <Button variant="outline" size="sm" data-testid="button-pause-timer">
                  <i className="fas fa-pause mr-1"></i>
                  Pause
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
          <TabsTrigger value="time-tracking" data-testid="tab-time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <Card className="p-12 text-center">
                <i className="fas fa-file-invoice text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
                <Button>
                  <i className="fas fa-plus mr-2"></i>
                  Create Invoice
                </Button>
              </Card>
            ) : (
              filteredInvoices.map((invoice: any) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`invoice-card-${invoice.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          invoice.status === "paid" ? "bg-success/10" :
                          invoice.status === "overdue" ? "bg-destructive/10" :
                          "bg-primary/10"
                        }`}>
                          <i className={`fas fa-file-invoice text-xl ${
                            invoice.status === "paid" ? "text-success" :
                            invoice.status === "overdue" ? "text-destructive" :
                            "text-primary"
                          }`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground font-mono">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            Client: {invoice.client?.name || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(parseFloat(invoice.totalAmount || "0"))}
                        </p>
                        <Badge variant={getStatusBadgeVariant(invoice.status)} className="mb-2">
                          {invoice.status}
                        </Badge>
                        {invoice.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(invoice.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <Button variant="ghost" size="sm" data-testid={`button-view-invoice-${invoice.id}`}>
                        <i className="fas fa-eye mr-1"></i>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-download-invoice-${invoice.id}`}>
                        <i className="fas fa-download mr-1"></i>
                        Download
                      </Button>
                      {invoice.status !== "paid" && (
                        <Button variant="ghost" size="sm" data-testid={`button-send-invoice-${invoice.id}`}>
                          <i className="fas fa-paper-plane mr-1"></i>
                          Send
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-stopwatch text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No time entries</h3>
                  <p className="text-muted-foreground">Start tracking time to see entries here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeEntries.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <div>
                        <p className="font-medium text-foreground">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.startTime)} • Duration: {Math.round(entry.duration / 60)} hours
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(parseFloat(entry.rate || "0") * (entry.duration / 60))}
                        </p>
                        <Badge variant={entry.isBillable ? "default" : "secondary"} className="text-xs">
                          {entry.isBillable ? "Billable" : "Non-billable"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <i className="fas fa-receipt text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">Expense Management</h3>
                <p className="text-muted-foreground mb-4">Track and categorize your business expenses</p>
                <Button data-testid="button-add-expense">
                  <i className="fas fa-plus mr-2"></i>
                  Add Expense
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
