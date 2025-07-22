import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { styles } from "@/lib/styles";

interface DashboardHeaderProps {
  title: string;
  description: string;
  showSearch?: boolean;
  showCreateButton?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
}

export function DashboardHeader({ 
  title, 
  description, 
  showSearch = false, 
  showCreateButton = false,
  createButtonText = "Create New",
  onCreateClick
}: DashboardHeaderProps) {
  return (
    <div className={showCreateButton ? "flex items-center justify-between" : ""}>
      <div>
        <h1 className={`text-3xl font-bold ${styles.text.primary} mb-2`}>{title}</h1>
        <p className={`${styles.text.secondary} ${showSearch ? "mb-6" : ""}`}>{description}</p>
        
        {showSearch && (
          <div className="relative max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${styles.text.secondary} h-4 w-4`} />
            <Input
              placeholder="Search content..."
              className={`pl-10 bg-slate-800/50 border-slate-700 ${styles.text.primary} placeholder:${styles.text.secondary}`}
            />
          </div>
        )}
      </div>
      
      {showCreateButton && (
        <Button 
          onClick={onCreateClick}
          className={styles.background.button}
        >
          <Plus className="mr-2 h-4 w-4" />
          {createButtonText}
        </Button>
      )}
    </div>
  );
}