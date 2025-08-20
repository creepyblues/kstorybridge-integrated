/**
 * Mobile-optimized style utilities for consistent component balance
 */

// Responsive padding classes
export const responsivePadding = {
  page: 'px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16 lg:py-20',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
};

// Responsive text sizes
export const responsiveText = {
  h1: 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl',
  h2: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  h3: 'text-xl sm:text-2xl lg:text-3xl',
  h4: 'text-lg sm:text-xl lg:text-2xl',
  body: 'text-base sm:text-lg',
  bodyLarge: 'text-lg sm:text-xl lg:text-2xl',
  small: 'text-sm sm:text-base',
};

// Responsive grid layouts
export const responsiveGrid = {
  twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8',
  threeColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8',
  fourColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  sixColumn: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6',
};

// Responsive button sizes
export const responsiveButton = {
  large: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg',
  medium: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
  small: 'px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm',
};

// Responsive spacing
export const responsiveSpacing = {
  sectionGap: 'space-y-12 sm:space-y-16 lg:space-y-20',
  elementGap: 'space-y-4 sm:space-y-6 lg:space-y-8',
  smallGap: 'space-y-2 sm:space-y-3 lg:space-y-4',
};

// Card styles optimized for mobile
export const responsiveCard = {
  base: 'rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8',
  compact: 'rounded-lg p-3 sm:p-4 lg:p-6',
};