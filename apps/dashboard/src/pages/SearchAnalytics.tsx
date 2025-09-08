import React, { useState } from 'react';
import { SearchAnalyticsDashboard } from '@/components/SearchAnalyticsDashboard';
import { Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kstorybridge/ui";

export default function SearchAnalytics() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
            <p className="text-gray-600 mt-2">Monitor search performance and user behavior</p>
          </div>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SearchAnalyticsDashboard timeRange={timeRange} />
    </div>
  );
}