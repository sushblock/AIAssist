import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

export default function BillingSection() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(numAmount || 0);
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

  const thisMonthRevenue = invoices
    .filter((inv: any) => {
      const invoiceDate = new Date(inv.createdAt);
      const now = new Date();
      return inv.status === "paid" && 
             invoiceDate.getMonth() === now.getMonth() && 
             invoiceDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || "0"), 0);

  const pendingAmount = invoices
    .filter((inv: any) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || "0"), 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="billing-section">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Billing & Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">GST-compliant invoicing and time tracking</p>
          </div>
          <Button data-testid="button-create-invoice">
            <i className="fas fa-file-invoice mr-2"></i>
            New Invoice
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-4 bg-gradient-to-br from-success/10 to-transparent">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Total Revenue (This Month)</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(thisMonthRevenue)}</p>
              <p className="text-xs text-success mt-1">
                <i className="fas fa-arrow-up mr-1"></i>12% vs last month
              </p>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Pending Invoices</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-warning mt-1">
                <i className="fas fa-clock mr-1"></i>
                {invoices.filter((inv: any) => inv.status === "overdue").length} invoices overdue
              </p>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground mb-1">Billable Hours (This Week)</p>
              <p className="text-3xl font-bold text-foreground">32.5 hrs</p>
              <p className="text-xs text-muted-foreground mt-1">
                ₹3,500/hr average rate
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Recent Invoices</h3>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-file-invoice text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No invoices yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice to start billing clients</p>
              <Button data-testid="button-create-first-invoice">
                <i className="fas fa-plus mr-2"></i>
                Create Invoice
              </Button>
            </div>
          ) : (
            invoices.slice(0, 3).map((invoice: any) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition cursor-pointer"
                data-testid={`invoice-item-${invoice.id}`}
              >
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
                    <p className="font-semibold text-foreground font-mono">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Client: {invoice.client?.name || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matter: {invoice.matter?.caseNo || "General"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className="mb-1">
                    {invoice.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invoice.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Active Timer */}
        <div className="mt-6 p-4 border border-border rounded-lg bg-primary/5">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-primary mt-1"></i>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Time Tracking Active</p>
              <p className="text-sm text-muted-foreground">
                Currently tracking: CS 234/2024 - Document Review
                <span className="font-mono font-semibold ml-2">01:23:45</span>
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Button size="sm" data-testid="button-stop-timer">
                  <i className="fas fa-stop mr-1"></i>Stop
                </Button>
                <Button variant="outline" size="sm" data-testid="button-pause-timer">
                  <i className="fas fa-pause mr-1"></i>Pause
                </Button>
              </div>
            </div>
          </div>
        </div>

        {invoices.length > 3 && (
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              className="text-sm text-primary hover:underline"
              data-testid="button-view-all-invoices"
            >
              View All Invoices →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
