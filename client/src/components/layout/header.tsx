import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export default function Header({ onMenuClick, isMobile }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    staleTime: 30000,
  });

  const unreadCount = notifications?.filter((n: any) => !n.readAt).length || 0;

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        {isMobile && (
          <button 
            className="text-muted-foreground"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        )}
        
        {/* Global Search */}
        <div className="flex-1 max-w-2xl relative">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <input 
            type="text" 
            placeholder="Search matters, parties, or ask AI..." 
            className="input pl-10 pr-24" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <span className="badge badge-secondary text-xs">⌘K</span>
            <i className="fas fa-robot text-accent"></i>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Language Toggle */}
        <button 
          className="btn btn-outline px-3 py-1 text-xs" 
          onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
          data-testid="button-language"
        >
          <i className="fas fa-language mr-1"></i>
          <span>{language}</span>
        </button>

        {/* BCI Compliance Indicator */}
        <div className="flex items-center space-x-2" title="BCI Rule 36 Compliance Mode">
          <i className="fas fa-shield-alt text-success text-sm"></i>
          <span className="text-xs text-muted-foreground hidden md:inline">BCI Safe</span>
        </div>

        {/* Online Status */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground hidden md:inline">Online</span>
        </div>

        {/* Notifications */}
        <button 
          className="relative text-muted-foreground hover:text-foreground"
          data-testid="button-notifications"
        >
          <i className="fas fa-bell text-xl"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <button 
          className="flex items-center space-x-2"
          data-testid="button-profile"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
            <span>AK</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-foreground">Adv. Kumar</p>
            <p className="text-xs text-muted-foreground">Delhi HC</p>
          </div>
          <i className="fas fa-chevron-down text-muted-foreground text-xs"></i>
        </button>
      </div>
    </header>
  );
}
