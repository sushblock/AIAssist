import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { path: "/", label: "Today", icon: "fas fa-home", badge: "3" },
    { path: "/matters", label: "Matters", icon: "fas fa-briefcase", count: "42" },
    { path: "/calendar", label: "Calendar", icon: "fas fa-calendar-alt" },
    { path: "/alerts", label: "Court Alerts", icon: "fas fa-bell", badge: "2", badgeColor: "destructive" },
    { path: "/parties", label: "Parties", icon: "fas fa-users" },
    { path: "/documents", label: "Documents", icon: "fas fa-file-alt" },
    { path: "/tasks", label: "Tasks", icon: "fas fa-tasks" },
    { path: "/billing", label: "Billing", icon: "fas fa-file-invoice-dollar" },
  ];

  const aiTools = [
    { path: "/ai-analysis", label: "Document Analysis", icon: "fas fa-magic" },
    { path: "/ai-search", label: "Smart Search", icon: "fas fa-search" },
    { path: "/ai-summary", label: "Case Summaries", icon: "fas fa-file-contract" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 w-64" : "w-64",
          isMobile && !isOpen && "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-gavel text-primary-foreground text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">LawMasters</h1>
              <p className="text-xs text-muted-foreground">Legal Practice OS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => isMobile && onClose()}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "badge ml-auto",
                      item.badgeColor === "destructive" ? "badge-destructive" : "badge-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-xs ml-auto">{item.count}</span>
                  )}
                </a>
              </Link>
            ))}
          </div>

          {/* AI Tools Section */}
          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              AI Tools
            </p>
            <div className="space-y-1">
              {aiTools.map((tool) => (
                <Link key={tool.path} href={tool.path}>
                  <a 
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition",
                      isActive(tool.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      tool.path === "/ai-analysis" && "ai-glow"
                    )}
                    onClick={() => isMobile && onClose()}
                    data-testid={`ai-${tool.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <i className={`${tool.icon} w-5`}></i>
                    <span>{tool.label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Storage Usage */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Storage Used</span>
            <span className="text-xs font-semibold text-foreground">1.2 GB</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "12%" }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">of 10 GB (Solo Plan)</p>
        </div>
      </aside>
    </>
  );
}
