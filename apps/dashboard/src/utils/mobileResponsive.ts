/**
 * Mobile-responsive utility classes for dashboard components
 * These ensure consistent mobile experience without affecting desktop
 */

// Mobile-optimized container classes
export const mobileContainer = {
  // Narrower margins on mobile for more content space
  page: 'px-3 sm:px-6 lg:px-8',
  section: 'py-6 sm:py-8 lg:py-12',
  card: 'p-4 sm:p-6 lg:p-8',
  modal: 'p-4 sm:p-6',
};

// Mobile-first typography scaling
export const mobileText = {
  h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
  h3: 'text-lg sm:text-xl lg:text-2xl',
  h4: 'text-base sm:text-lg lg:text-xl',
  body: 'text-sm sm:text-base',
  bodyLarge: 'text-base sm:text-lg',
  caption: 'text-xs sm:text-sm',
};

// Mobile-optimized spacing
export const mobileSpacing = {
  sectionGap: 'space-y-6 sm:space-y-8 lg:space-y-12',
  componentGap: 'space-y-3 sm:space-y-4 lg:space-y-6',
  elementGap: 'space-y-2 sm:space-y-3',
  buttonGap: 'gap-2 sm:gap-3 lg:gap-4',
};

// Mobile grid layouts
export const mobileGrid = {
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  features: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6',
  pricing: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  titles: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6',
};

// Mobile button styles
export const mobileButton = {
  primary: 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base',
  secondary: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
  large: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
  fullWidth: 'w-full sm:w-auto',
};

// Mobile table/list styles
export const mobileTable = {
  container: 'overflow-x-auto sm:overflow-visible',
  header: 'text-xs sm:text-sm font-medium',
  cell: 'px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm',
  actions: 'flex flex-col sm:flex-row gap-1 sm:gap-2',
};

// Mobile modal styles
export const mobileModal = {
  overlay: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-6',
  content: 'w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto',
  header: 'pb-3 sm:pb-4 border-b',
  body: 'py-4 sm:py-6',
  footer: 'pt-3 sm:pt-4 border-t',
};

// Mobile navigation styles
export const mobileNav = {
  sidebar: 'hidden lg:block',
  mobileMenu: 'lg:hidden',
  menuButton: 'p-2 rounded-md lg:hidden',
  menuOverlay: 'fixed inset-0 bg-black/50 z-40 lg:hidden',
  menuPanel: 'fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 lg:hidden',
};

// Mobile-specific utilities
export const mobileUtils = {
  hideOnMobile: 'hidden sm:block',
  showOnMobile: 'block sm:hidden',
  stackOnMobile: 'flex flex-col sm:flex-row',
  centerOnMobile: 'text-center sm:text-left',
  fullWidthOnMobile: 'w-full sm:w-auto',
  scrollable: 'overflow-x-auto sm:overflow-visible',
  touchFriendly: 'touch-manipulation',
};

// Breakpoint-aware padding helper
export function getResponsivePadding(base: 'page' | 'section' | 'card' | 'modal') {
  return mobileContainer[base];
}

// Text size helper
export function getResponsiveText(size: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'caption') {
  return mobileText[size];
}

// Grid helper
export function getResponsiveGrid(type: 'cards' | 'features' | 'pricing' | 'titles') {
  return mobileGrid[type];
}