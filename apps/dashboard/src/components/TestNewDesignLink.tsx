import { Link, useParams } from "react-router-dom";
import { Button } from "@kstorybridge/ui";
import { Sparkles } from "lucide-react";

export default function TestNewDesignLink() {
  const { titleId } = useParams();
  
  if (!titleId) return null;
  
  const currentPath = window.location.pathname;
  const isNewDesign = currentPath.includes('titles-new');
  
  if (isNewDesign) {
    // Show link to old design
    const oldPath = currentPath.replace('titles-new', 'titles');
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          asChild
          variant="outline"
          className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-lg"
        >
          <Link to={oldPath}>
            View Original Design
          </Link>
        </Button>
      </div>
    );
  }
  
  // Show link to new design
  const newPath = currentPath.replace('/titles/', '/titles-new/');
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Button
        asChild
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg animate-pulse"
      >
        <Link to={newPath}>
          <Sparkles className="h-4 w-4 mr-2" />
          Try New Design
        </Link>
      </Button>
    </div>
  );
}