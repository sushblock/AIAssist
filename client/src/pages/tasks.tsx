import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";

const taskFormSchema = insertTaskSchema.omit({ orgId: true, assigneeId: true });

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: matters = [] } = useQuery({
    queryKey: ["/api/matters"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskFormSchema>) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Task Created",
        description: "New task has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
    },
  });

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const onSubmit = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data);
  };

  const toggleTaskStatus = (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const updates = {
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : null,
    };
    updateTaskMutation.mutate({ id: task.id, updates });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "outline";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "outline";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const isOverdue = (task: any) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
  };

  const pendingTasks = filteredTasks.filter((t: any) => t.status !== "completed");
  const completedTasks = filteredTasks.filter((t: any) => t.status === "completed");
  const overdueTasks = pendingTasks.filter(isOverdue);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="tasks-loading">
        <div className="skeleton h-8 w-48"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
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
    <div className="space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your to-do list and deadlines</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <i className="fas fa-plus mr-2"></i>
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} data-testid="input-task-title" />
                      </FormControl>
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
                        <Textarea placeholder="Task description (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
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
                    disabled={createTaskMutation.isPending}
                    data-testid="button-submit-task"
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
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
            <div className="text-2xl font-bold text-foreground">{pendingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {pendingTasks.filter((t: any) => t.priority === "high").length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <i className="fas fa-tasks text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your search or filters" 
                : "Create your first task to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <i className="fas fa-plus mr-2"></i>
                Create Task
              </Button>
            )}
          </Card>
        ) : (
          filteredTasks.map((task: any) => (
            <Card 
              key={task.id} 
              className={`hover:shadow-md transition-shadow ${
                isOverdue(task) ? "border-destructive/50 bg-destructive/5" : ""
              }`}
              data-testid={`task-card-${task.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTaskStatus(task)}
                    className="mt-1"
                    data-testid={`checkbox-task-${task.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          task.status === "completed" 
                            ? "text-muted-foreground line-through" 
                            : "text-foreground"
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {isOverdue(task) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {task.dueDate && (
                        <span className={isOverdue(task) ? "text-destructive font-medium" : ""}>
                          <i className="fas fa-calendar mr-1"></i>
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        Created: {formatDate(task.createdAt)}
                      </span>
                      {task.completedAt && (
                        <span className="text-success">
                          <i className="fas fa-check mr-1"></i>
                          Completed: {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" data-testid={`button-edit-${task.id}`}>
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-${task.id}`}>
                      <i className="fas fa-trash mr-1"></i>
                      Delete
                    </Button>
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
