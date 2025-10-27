// Design system constants for consistent styling
export const styles = {
  // Card styles
  card: {
    base: "bg-slate-800/50 border-slate-700 backdrop-blur-sm",
    hover: "hover:bg-slate-900/70 transition-colors",
    interactive: "bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
  },

  // Text colors
  text: {
    primary: "text-white",
    secondary: "text-slate-400", 
    muted: "text-slate-500",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400"
  },

  // Background gradients
  background: {
    main: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
    button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
  },

  // Common component combinations
  statCard: "bg-slate-800/50 border-slate-700 backdrop-blur-sm",
  activityItem: "bg-slate-900/50 hover:bg-slate-900/70 transition-colors",
  
  // Status badge colors
  badge: {
    published: "bg-green-600/20 text-green-400 border-green-600/30",
    draft: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    favorite: "bg-red-600/20 text-red-400 border-red-600/30",
    deal: "bg-green-600/20 text-green-400 border-green-600/30",
    view: "bg-blue-600/20 text-blue-400 border-blue-600/30"
  }
} as const;