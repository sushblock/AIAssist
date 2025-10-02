import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/date-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTimeEntrySchema, insertExpenseSchema } from "@shared/schema";
import type { Invoice, Matter, TimeEntry, Expense, Party, Organization } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import { Clock } from "lucide-react";

const timeEntryFormSchema = z.object({
  matterId: z.string().min(1, "Matter is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  durationHours: z.string().optional(),
  rate: z.string().min(1, "Rate is required"),
  isBillable: z.boolean(),
});

type TimeEntryFormData = z.infer<typeof timeEntryFormSchema>;

const expenseFormSchema = z.object({
  matterId: z.string().min(1, "Matter is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a valid positive number",
    }),
  tax: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Tax must be a valid non-negative number",
    }),
  isBillable: z.boolean(),
  receipt: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isTimeEntryDialogOpen, setIsTimeEntryDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [selectedMatterId, setSelectedMatterId] = useState("");
  const [selectedLineItems, setSelectedLineItems] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { activeTimer, startTimer, stopTimer, pauseTimer } = useAppStore();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: matters = [] } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
  });

  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const { data: matterTimeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", selectedMatterId],
    queryFn: async () => {
      const response = await fetch(`/api/time-entries?matterId=${selectedMatterId}`);
      if (!response.ok) throw new Error('Failed to fetch time entries');
      return response.json();
    },
    enabled: !!selectedMatterId && isInvoiceDialogOpen,
  });

  const { data: matterExpenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", selectedMatterId],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?matterId=${selectedMatterId}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    enabled: !!selectedMatterId && isInvoiceDialogOpen,
  });

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      matterId: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
      durationHours: "",
      rate: "5000",
      isBillable: true,
    },
  });

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      matterId: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      amount: "",
      tax: "",
      isBillable: true,
      receipt: "",
    },
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: TimeEntryFormData) => {
      const { date, startTime, endTime, durationHours, ...rest } = data;
      
      let duration: number;
      if (durationHours) {
        duration = parseFloat(durationHours) * 60;
      } else if (startTime && endTime) {
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);
        duration = (end.getTime() - start.getTime()) / (1000 * 60);
      } else {
        throw new Error("Either duration or start/end time is required");
      }

      const startDateTime = new Date(`${date}T${startTime || "00:00"}`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null;

      const response = await apiRequest("POST", "/api/time-entries", {
        ...rest,
        duration: Math.round(duration),
        rate: parseFloat(data.rate),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString() || null,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
      setIsTimeEntryDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time entry",
        variant: "destructive",
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const amount = parseFloat(data.amount);
      const tax = data.tax ? parseFloat(data.tax) : 0;
      
      if (isNaN(amount)) {
        throw new Error("Invalid amount value");
      }
      if (data.tax && isNaN(tax)) {
        throw new Error("Invalid tax value");
      }
      
      const response = await apiRequest("POST", "/api/expenses", {
        matterId: data.matterId,
        category: data.category,
        description: data.description,
        date: new Date(data.date).toISOString(),
        amount,
        tax,
        isBillable: data.isBillable,
        receipt: data.receipt || null,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      setIsExpenseDialogOpen(false);
      expenseForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsInvoiceDialogOpen(false);
      setSelectedMatterId("");
      setSelectedLineItems([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleTimerStop = async () => {
    if (!activeTimer) return;
    
    const totalMinutes = Math.round((activeTimer.duration + (Date.now() - activeTimer.startTime)) / (1000 * 60));
    
    try {
      await apiRequest("POST", "/api/time-entries", {
        matterId: activeTimer.matterId,
        description: activeTimer.description,
        duration: totalMinutes,
        rate: 5000,
        isBillable: true,
        startTime: new Date(activeTimer.startTime).toISOString(),
        endTime: new Date().toISOString(),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      stopTimer();
      toast({
        title: "Timer Stopped",
        description: `Time entry created: ${Math.round(totalMinutes / 60)} hours ${totalMinutes % 60} minutes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create time entry from timer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const elapsed = activeTimer.duration + (Date.now() - activeTimer.startTime);
        setTimerDuration(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const thisMonthInvoices = invoices.filter((inv: any) => {
      const invDate = new Date(inv.createdAt);
      return invDate.getFullYear() === year && invDate.getMonth() === now.getMonth();
    });
    const sequence = String(thisMonthInvoices.length + 1).padStart(4, '0');
    return `INV-${year}-${month}-${sequence}`;
  };

  const calculateGST = (subtotal: number, orgState?: string, clientState?: string) => {
    const gstRate = 0.18;
    const totalTax = subtotal * gstRate;

    if (orgState && clientState && orgState.toLowerCase() === clientState.toLowerCase()) {
      return {
        type: 'same_state',
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: 0,
        total: totalTax
      };
    } else {
      return {
        type: 'different_state',
        cgst: 0,
        sgst: 0,
        igst: totalTax,
        total: totalTax
      };
    }
  };

  const handleGenerateInvoice = () => {
    if (!selectedMatterId) {
      toast({
        title: "Error",
        description: "Please select a matter",
        variant: "destructive",
      });
      return;
    }

    const selectedMatter = matters.find((m: any) => m.id === selectedMatterId);
    const client = parties.find((p: any) => p.matterId === selectedMatterId && p.type === "client");

    const filteredTimeEntries = matterTimeEntries.filter((entry: any) => 
      entry.isBillable && entry.matterId === selectedMatterId
    );
    const filteredExpenses = matterExpenses.filter((exp: any) => 
      exp.isBillable && exp.matterId === selectedMatterId
    );

    const lineItems = [
      ...filteredTimeEntries.map((entry: any) => ({
        type: 'time',
        description: entry.description,
        date: entry.startTime,
        amount: (entry.duration / 60) * parseFloat(entry.rate || "0"),
        quantity: entry.duration / 60,
        rate: parseFloat(entry.rate || "0")
      })),
      ...filteredExpenses.map((exp: any) => ({
        type: 'expense',
        description: exp.description,
        date: exp.date,
        amount: parseFloat(exp.amount || "0"),
        quantity: 1,
        rate: parseFloat(exp.amount || "0")
      }))
    ];

    const selectedItems = lineItems.filter((_, index) => 
      selectedLineItems.includes(index.toString())
    );

    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one line item",
        variant: "destructive",
      });
      return;
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
    const gstCalc = calculateGST(subtotal, organization?.state, client?.state);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    createInvoiceMutation.mutate({
      invoiceNumber: generateInvoiceNumber(),
      clientId: client?.id || null,
      matterId: selectedMatterId,
      amount: subtotal,
      tax: gstCalc.total,
      totalAmount: subtotal + gstCalc.total,
      status: "draft",
      dueDate: dueDate.toISOString(),
      gstNumber: organization?.gstNumber || null,
      lineItems: selectedItems,
      pdfUrl: null,
    });
  };

  useEffect(() => {
    if (selectedMatterId && isInvoiceDialogOpen) {
      const filteredTimeEntries = matterTimeEntries.filter((entry: any) => 
        entry.isBillable && entry.matterId === selectedMatterId
      );
      const filteredExpenses = matterExpenses.filter((exp: any) => 
        exp.isBillable && exp.matterId === selectedMatterId
      );
      
      const allItems = [...filteredTimeEntries, ...filteredExpenses];
      setSelectedLineItems(allItems.map((_, index) => index.toString()));
    }
  }, [selectedMatterId, matterTimeEntries, matterExpenses, isInvoiceDialogOpen]);

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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-start-timer">
                <i className="fas fa-play mr-2"></i>
                Start Timer
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-start-timer">
              <DialogHeader>
                <DialogTitle>Start Timer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Matter</label>
                  <Select onValueChange={(value) => {
                    const matter = matters.find((m: any) => m.id === value);
                    if (matter) {
                      startTimer(matter.id, `Work on ${matter.caseNo}`);
                    }
                  }}>
                    <SelectTrigger data-testid="select-timer-matter">
                      <SelectValue placeholder="Select matter" />
                    </SelectTrigger>
                    <SelectContent>
                      {matters.map((matter: any) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          {matter.caseNo} - {matter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invoice">
                <i className="fas fa-file-invoice mr-2"></i>
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invoice-form">
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Matter</label>
                  <Select value={selectedMatterId} onValueChange={setSelectedMatterId}>
                    <SelectTrigger data-testid="select-invoice-matter">
                      <SelectValue placeholder="Select matter" />
                    </SelectTrigger>
                    <SelectContent>
                      {matters.map((matter: any) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          {matter.caseNo} - {matter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMatterId && (
                  <>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Client</p>
                          <p className="font-medium" data-testid="text-invoice-client">
                            {parties.find((p: any) => p.matterId === selectedMatterId && p.type === "client")?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Matter</p>
                          <p className="font-medium" data-testid="text-invoice-matter">
                            {matters.find((m: any) => m.id === selectedMatterId)?.caseNo}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Invoice Number</p>
                          <p className="font-mono font-medium" data-testid="text-invoice-number">{generateInvoiceNumber()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">GST Number</p>
                          <p className="font-medium" data-testid="text-gst-number">{organization?.gstNumber || "Not Set"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Line Items</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="text-left p-2 text-sm font-medium">
                                  <Checkbox
                                    checked={selectedLineItems.length > 0}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        const allItems = [...matterTimeEntries.filter((e: any) => e.isBillable && e.matterId === selectedMatterId), ...matterExpenses.filter((e: any) => e.isBillable && e.matterId === selectedMatterId)];
                                        setSelectedLineItems(allItems.map((_, i) => i.toString()));
                                      } else {
                                        setSelectedLineItems([]);
                                      }
                                    }}
                                    data-testid="checkbox-select-all"
                                  />
                                </th>
                                <th className="text-left p-2 text-sm font-medium">Type</th>
                                <th className="text-left p-2 text-sm font-medium">Description</th>
                                <th className="text-left p-2 text-sm font-medium">Date</th>
                                <th className="text-right p-2 text-sm font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matterTimeEntries.filter((e: any) => e.isBillable && e.matterId === selectedMatterId).map((entry: any, index: number) => (
                                <tr key={`time-${index}`} className="border-t">
                                  <td className="p-2">
                                    <Checkbox
                                      checked={selectedLineItems.includes(index.toString())}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedLineItems([...selectedLineItems, index.toString()]);
                                        } else {
                                          setSelectedLineItems(selectedLineItems.filter(id => id !== index.toString()));
                                        }
                                      }}
                                      data-testid={`checkbox-item-${index}`}
                                    />
                                  </td>
                                  <td className="p-2 text-sm">
                                    <Badge variant="outline">Time</Badge>
                                  </td>
                                  <td className="p-2 text-sm">{entry.description}</td>
                                  <td className="p-2 text-sm">{formatDate(entry.startTime)}</td>
                                  <td className="p-2 text-sm text-right" data-testid={`amount-time-${index}`}>
                                    {formatCurrency((entry.duration / 60) * parseFloat(entry.rate || "0"))}
                                  </td>
                                </tr>
                              ))}
                              {matterExpenses.filter((e: any) => e.isBillable && e.matterId === selectedMatterId).map((expense: any, index: number) => {
                                const adjustedIndex = index + matterTimeEntries.filter((e: any) => e.isBillable && e.matterId === selectedMatterId).length;
                                return (
                                  <tr key={`expense-${index}`} className="border-t">
                                    <td className="p-2">
                                      <Checkbox
                                        checked={selectedLineItems.includes(adjustedIndex.toString())}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedLineItems([...selectedLineItems, adjustedIndex.toString()]);
                                          } else {
                                            setSelectedLineItems(selectedLineItems.filter(id => id !== adjustedIndex.toString()));
                                          }
                                        }}
                                        data-testid={`checkbox-item-${adjustedIndex}`}
                                      />
                                    </td>
                                    <td className="p-2 text-sm">
                                      <Badge variant="secondary">Expense</Badge>
                                    </td>
                                    <td className="p-2 text-sm">{expense.description}</td>
                                    <td className="p-2 text-sm">{formatDate(expense.date)}</td>
                                    <td className="p-2 text-sm text-right" data-testid={`amount-expense-${index}`}>
                                      {formatCurrency(parseFloat(expense.amount || "0"))}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const filteredTimeEntries = matterTimeEntries.filter((e: any) => e.isBillable && e.matterId === selectedMatterId);
                      const filteredExpenses = matterExpenses.filter((e: any) => e.isBillable && e.matterId === selectedMatterId);
                      const lineItems = [
                        ...filteredTimeEntries.map((entry: any) => ({
                          amount: (entry.duration / 60) * parseFloat(entry.rate || "0")
                        })),
                        ...filteredExpenses.map((exp: any) => ({
                          amount: parseFloat(exp.amount || "0")
                        }))
                      ];
                      const selectedItems = lineItems.filter((_, index) => selectedLineItems.includes(index.toString()));
                      const subtotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);
                      const client = parties.find((p: any) => p.matterId === selectedMatterId && p.type === "client");
                      const gstCalc = calculateGST(subtotal, organization?.state, client?.state);

                      return (
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Subtotal:</span>
                            <span className="font-medium" data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
                          </div>
                          {gstCalc.type === 'same_state' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm">CGST (9%):</span>
                                <span className="font-medium" data-testid="text-cgst">{formatCurrency(gstCalc.cgst)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">SGST (9%):</span>
                                <span className="font-medium" data-testid="text-sgst">{formatCurrency(gstCalc.sgst)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-sm">IGST (18%):</span>
                              <span className="font-medium" data-testid="text-igst">{formatCurrency(gstCalc.igst)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t">
                            <span className="font-semibold">Total Amount:</span>
                            <span className="font-bold text-lg" data-testid="text-total">{formatCurrency(subtotal + gstCalc.total)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Due Date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsInvoiceDialogOpen(false);
                          setSelectedMatterId("");
                          setSelectedLineItems([]);
                        }}
                        data-testid="button-cancel-invoice"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateInvoice}
                        disabled={createInvoiceMutation.isPending || selectedLineItems.length === 0}
                        data-testid="button-generate-invoice"
                      >
                        {createInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
      {activeTimer && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Clock className="text-primary text-xl mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Time Tracking Active</p>
                <p className="text-sm text-muted-foreground">
                  Currently tracking: {activeTimer.description}
                  <span className="font-mono font-semibold ml-2 text-primary">{formatDuration(timerDuration)}</span>
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Button size="sm" onClick={handleTimerStop} data-testid="button-stop-timer">
                    <i className="fas fa-stop mr-1"></i>
                    Stop
                  </Button>
                  <Button variant="outline" size="sm" onClick={pauseTimer} data-testid="button-pause-timer">
                    <i className="fas fa-pause mr-1"></i>
                    Pause
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="flex justify-end">
            <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-time-entry">
                  <i className="fas fa-plus mr-2"></i>
                  Add Time Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-time-entry-form">
                <DialogHeader>
                  <DialogTitle>Add Time Entry</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createTimeEntryMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="matterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matter</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="input-matter">
                                <SelectValue placeholder="Select matter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the work performed..."
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const endTime = form.getValues("endTime");
                                  if (endTime && e.target.value) {
                                    const start = new Date(`2000-01-01T${e.target.value}`);
                                    const end = new Date(`2000-01-01T${endTime}`);
                                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    form.setValue("durationHours", hours.toFixed(2));
                                  }
                                }}
                                data-testid="input-start-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const startTime = form.getValues("startTime");
                                  if (startTime && e.target.value) {
                                    const start = new Date(`2000-01-01T${startTime}`);
                                    const end = new Date(`2000-01-01T${e.target.value}`);
                                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    form.setValue("durationHours", hours.toFixed(2));
                                  }
                                }}
                                data-testid="input-end-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="durationHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.25"
                              placeholder="Or enter duration manually"
                              {...field}
                              data-testid="input-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate (₹ per hour)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="100"
                              placeholder="5000"
                              {...field}
                              data-testid="input-rate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isBillable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="input-billable"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Billable</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsTimeEntryDialogOpen(false)}
                        data-testid="button-cancel-time-entry"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTimeEntryMutation.isPending}
                        data-testid="button-submit-time-entry"
                      >
                        {createTimeEntryMutation.isPending ? "Creating..." : "Create Time Entry"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

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
                    <div key={entry.id} className="flex items-center justify-between p-3 border border-border rounded-md" data-testid={`time-entry-${entry.id}`}>
                      <div>
                        <p className="font-medium text-foreground">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.startTime)} • Duration: {(entry.duration / 60).toFixed(2)} hours
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
          <div className="flex justify-end">
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-expense">
                  <i className="fas fa-plus mr-2"></i>
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-expense-form">
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <Form {...expenseForm}>
                  <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={expenseForm.control}
                      name="matterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matter</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="input-expense-matter">
                                <SelectValue placeholder="Select matter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

                    <FormField
                      control={expenseForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="input-expense-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Court Fees">Court Fees</SelectItem>
                              <SelectItem value="Travel">Travel</SelectItem>
                              <SelectItem value="Printing">Printing</SelectItem>
                              <SelectItem value="Postage">Postage</SelectItem>
                              <SelectItem value="Consultation">Consultation</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={expenseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the expense..."
                              {...field}
                              data-testid="input-expense-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={expenseForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-expense-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={expenseForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-expense-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={expenseForm.control}
                        name="tax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax/GST (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-expense-tax"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={expenseForm.control}
                      name="receipt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt/Reference</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Receipt number or reference"
                              {...field}
                              data-testid="input-expense-receipt"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={expenseForm.control}
                      name="isBillable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="input-expense-billable"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Billable</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsExpenseDialogOpen(false)}
                        data-testid="button-cancel-expense"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createExpenseMutation.isPending}
                        data-testid="button-submit-expense"
                      >
                        {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-receipt text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No expenses recorded</h3>
                  <p className="text-muted-foreground">Start tracking expenses to see them here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense: any) => {
                    const matter = matters.find((m: any) => m.id === expense.matterId);
                    const totalAmount = parseFloat(expense.amount || "0") + parseFloat(expense.tax || "0");
                    
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-4 border border-border rounded-md" data-testid={`expense-${expense.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs" data-testid={`expense-category-${expense.id}`}>
                              {expense.category}
                            </Badge>
                            {expense.isBillable && (
                              <Badge variant="default" className="text-xs">
                                Billable
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-foreground" data-testid={`expense-description-${expense.id}`}>
                            {expense.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(expense.date)} • {matter ? `${matter.caseNo} - ${matter.title}` : "Unknown matter"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground" data-testid={`expense-total-${expense.id}`}>
                            {formatCurrency(totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Amount: {formatCurrency(parseFloat(expense.amount || "0"))}
                          </p>
                          {parseFloat(expense.tax || "0") > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Tax: {formatCurrency(parseFloat(expense.tax || "0"))}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
