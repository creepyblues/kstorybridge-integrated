/**
 * Solar Icon System
 *
 * Centralized icon management using Iconify Solar icon set.
 * Bold Duotone style for premium entertainment aesthetic.
 */

import { Icon, IconProps } from '@iconify/react';
import { forwardRef } from 'react';

// Icon name mapping from Lucide to Solar
export const solarIcons = {
  // Navigation & UI
  search: 'solar:magnifer-bold-duotone',
  close: 'solar:close-circle-bold-duotone',
  x: 'solar:close-circle-bold-duotone',
  check: 'solar:check-circle-bold-duotone',
  chevronDown: 'solar:alt-arrow-down-bold-duotone',
  chevronUp: 'solar:alt-arrow-up-bold-duotone',
  chevronLeft: 'solar:alt-arrow-left-bold-duotone',
  chevronRight: 'solar:alt-arrow-right-bold-duotone',
  arrowLeft: 'solar:arrow-left-bold-duotone',
  arrowRight: 'solar:arrow-right-bold-duotone',
  arrowUp: 'solar:arrow-up-bold-duotone',
  arrowDown: 'solar:arrow-down-bold-duotone',
  menu: 'solar:hamburger-menu-bold-duotone',
  moreHorizontal: 'solar:menu-dots-bold-duotone',
  moreVertical: 'solar:menu-dots-vertical-bold-duotone',

  // Status & Alerts
  alertCircle: 'solar:danger-circle-bold-duotone',
  alertTriangle: 'solar:danger-triangle-bold-duotone',
  info: 'solar:info-circle-bold-duotone',
  checkCircle: 'solar:check-circle-bold-duotone',
  xCircle: 'solar:close-circle-bold-duotone',

  // User & Account
  user: 'solar:user-bold-duotone',
  users: 'solar:users-group-rounded-bold-duotone',
  userPlus: 'solar:user-plus-bold-duotone',
  userCheck: 'solar:user-check-bold-duotone',
  settings: 'solar:settings-bold-duotone',
  logOut: 'solar:logout-2-bold-duotone',
  logIn: 'solar:login-2-bold-duotone',

  // Home & Navigation
  home: 'solar:home-2-bold-duotone',
  building: 'solar:buildings-bold-duotone',
  globe: 'solar:global-bold-duotone',

  // Entertainment & Media
  film: 'solar:clapperboard-bold-duotone',
  tv: 'solar:tv-bold-duotone',
  play: 'solar:play-bold-duotone',
  pause: 'solar:pause-bold-duotone',
  video: 'solar:video-frame-bold-duotone',
  music: 'solar:music-note-bold-duotone',
  image: 'solar:gallery-bold-duotone',
  camera: 'solar:camera-bold-duotone',

  // Actions
  plus: 'solar:add-circle-bold-duotone',
  minus: 'solar:minus-circle-bold-duotone',
  edit: 'solar:pen-bold-duotone',
  pencil: 'solar:pen-bold-duotone',
  trash: 'solar:trash-bin-trash-bold-duotone',
  trash2: 'solar:trash-bin-trash-bold-duotone',
  copy: 'solar:copy-bold-duotone',
  download: 'solar:download-bold-duotone',
  upload: 'solar:upload-bold-duotone',
  share: 'solar:share-bold-duotone',
  share2: 'solar:share-bold-duotone',
  send: 'solar:plain-bold-duotone',
  refresh: 'solar:refresh-bold-duotone',
  refreshCw: 'solar:refresh-bold-duotone',
  rotateCcw: 'solar:refresh-bold-duotone',

  // Loading & Progress
  loader: 'solar:refresh-circle-bold-duotone',
  loader2: 'solar:refresh-circle-bold-duotone',

  // Favorites & Ratings
  star: 'solar:star-bold-duotone',
  heart: 'solar:heart-bold-duotone',
  bookmark: 'solar:bookmark-bold-duotone',
  thumbsUp: 'solar:like-bold-duotone',
  thumbsDown: 'solar:dislike-bold-duotone',

  // Communication
  mail: 'solar:letter-bold-duotone',
  phone: 'solar:phone-bold-duotone',
  messageCircle: 'solar:chat-round-dots-bold-duotone',
  messageSquare: 'solar:chat-square-bold-duotone',
  bell: 'solar:bell-bold-duotone',

  // Documents & Files
  file: 'solar:file-bold-duotone',
  fileText: 'solar:document-text-bold-duotone',
  folder: 'solar:folder-bold-duotone',
  folderOpen: 'solar:folder-open-bold-duotone',
  clipboard: 'solar:clipboard-bold-duotone',

  // Time & Calendar
  calendar: 'solar:calendar-bold-duotone',
  clock: 'solar:clock-circle-bold-duotone',

  // Security
  lock: 'solar:lock-bold-duotone',
  unlock: 'solar:lock-unlocked-bold-duotone',
  shield: 'solar:shield-bold-duotone',
  shieldCheck: 'solar:shield-check-bold-duotone',
  key: 'solar:key-bold-duotone',
  eye: 'solar:eye-bold-duotone',
  eyeOff: 'solar:eye-closed-bold-duotone',

  // Links & External
  link: 'solar:link-bold-duotone',
  link2: 'solar:link-bold-duotone',
  externalLink: 'solar:square-arrow-right-up-bold-duotone',

  // Filter & Sort
  filter: 'solar:filter-bold-duotone',
  sort: 'solar:sort-bold-duotone',
  sortAsc: 'solar:sort-from-bottom-to-top-bold-duotone',
  sortDesc: 'solar:sort-from-top-to-bottom-bold-duotone',

  // Analytics & Charts
  trendingUp: 'solar:graph-up-bold-duotone',
  trendingDown: 'solar:graph-down-bold-duotone',
  barChart: 'solar:chart-bold-duotone',
  barChart2: 'solar:chart-2-bold-duotone',
  pieChart: 'solar:pie-chart-2-bold-duotone',
  activity: 'solar:graph-bold-duotone',

  // Special
  sparkles: 'solar:stars-bold-duotone',
  zap: 'solar:bolt-bold-duotone',
  target: 'solar:target-bold-duotone',
  award: 'solar:cup-star-bold-duotone',
  crown: 'solar:crown-bold-duotone',
  gift: 'solar:gift-bold-duotone',

  // Layout
  layout: 'solar:widget-bold-duotone',
  layoutGrid: 'solar:widget-2-bold-duotone',
  layoutList: 'solar:list-bold-duotone',
  grid: 'solar:widget-4-bold-duotone',
  list: 'solar:list-bold-duotone',
  columns: 'solar:widget-3-bold-duotone',

  // Misc
  circleDot: 'solar:record-circle-bold-duotone',
  circle: 'solar:record-circle-bold-duotone',
  dot: 'solar:record-circle-bold-duotone',
  hash: 'solar:hashtag-bold-duotone',
  at: 'solar:at-sign-bold-duotone',
  percent: 'solar:sale-bold-duotone',
  dollarSign: 'solar:dollar-bold-duotone',
  creditCard: 'solar:card-bold-duotone',
  helpCircle: 'solar:question-circle-bold-duotone',
  mapPin: 'solar:map-point-bold-duotone',

  // Arrows for panels
  panelLeftClose: 'solar:sidebar-minimalistic-bold-duotone',
  panelLeftOpen: 'solar:sidebar-minimalistic-bold-duotone',
  panelRightClose: 'solar:sidebar-minimalistic-bold-duotone',
  panelRightOpen: 'solar:sidebar-minimalistic-bold-duotone',

  // Tools
  wrench: 'solar:wrench-bold-duotone',
  tool: 'solar:wrench-bold-duotone',
  layers: 'solar:layers-bold-duotone',
  sliders: 'solar:tuning-2-bold-duotone',

  // Expand/Collapse
  maximize: 'solar:maximize-bold-duotone',
  minimize: 'solar:minimize-bold-duotone',
  expand: 'solar:maximize-bold-duotone',
  shrink: 'solar:minimize-bold-duotone',
} as const;

export type IconName = keyof typeof solarIcons;

interface SolarIconProps extends Omit<IconProps, 'icon'> {
  name: IconName;
}

/**
 * SolarIcon Component
 *
 * Usage:
 * <SolarIcon name="search" className="h-4 w-4" />
 * <SolarIcon name="film" className="h-6 w-6 text-blue-500" />
 */
export const SolarIcon = forwardRef<SVGSVGElement, SolarIconProps>(
  ({ name, className = '', ...props }, ref) => {
    const iconName = solarIcons[name];
    if (!iconName) {
      console.warn(`[SolarIcon] Unknown icon name: ${name}`);
      return null;
    }
    return <Icon ref={ref} icon={iconName} className={className} {...props} />;
  }
);

SolarIcon.displayName = 'SolarIcon';

/**
 * Direct Icon component for custom Solar icons
 *
 * Usage:
 * <IconifyIcon icon="solar:custom-icon-bold-duotone" className="h-4 w-4" />
 */
export { Icon as IconifyIcon } from '@iconify/react';

/**
 * Helper to get Solar icon string for direct use
 */
export function getSolarIcon(name: IconName): string {
  return solarIcons[name] || 'solar:question-circle-bold-duotone';
}
