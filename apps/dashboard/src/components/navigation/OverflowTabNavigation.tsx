import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { getGenreIcon } from '@/lib/genreIcons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface TabItem {
  id: string;
  name: string;
  count?: number;
  icon?: string; // Optional override for default genre icon
}

interface OverflowTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  maxVisibleTabs?: number;
  className?: string;
}

export function OverflowTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  maxVisibleTabs = 5,
  className,
}: OverflowTabNavigationProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabs = tabs.slice(maxVisibleTabs);
  const hasOverflow = hiddenTabs.length > 0;

  // Check if active tab is in the hidden tabs
  const activeInHidden = hiddenTabs.some((tab) => tab.id === activeTab);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsSheetOpen(false);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation Container */}
      <div className="flex items-center border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {/* Visible Tabs */}
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconName = tab.icon || getGenreIcon(tab.name);

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-3 text-lg font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'border-[#4C9C9B] text-[#4C9C9B]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'
              )}
            >
              <Icon icon={iconName} className="w-5 h-5" />
              {tab.name}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-2 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-[#4C9C9B]/10 text-[#4C9C9B]'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Overflow Button */}
        {hasOverflow && (
          <button
            onClick={() => setIsSheetOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-3 text-lg font-semibold border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0',
              activeInHidden
                ? 'border-[#4C9C9B] text-[#4C9C9B]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            )}
          >
            <Icon icon="solar:add-circle-bold-duotone" className="w-5 h-5" />
            <span>+{hiddenTabs.length}</span>
          </button>
        )}
      </div>

      {/* Slide-out Sheet for Hidden Tabs */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[400px]">
          <SheetHeader className="mb-6">
            <SheetTitle>More Categories</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            {hiddenTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const iconName = tab.icon || getGenreIcon(tab.name);

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-[#4C9C9B]/10 text-[#4C9C9B]'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon icon={iconName} className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base font-medium flex-1 text-left">{tab.name}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'px-2.5 py-1 text-sm rounded-full',
                        isActive
                          ? 'bg-[#4C9C9B]/20 text-[#4C9C9B]'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
