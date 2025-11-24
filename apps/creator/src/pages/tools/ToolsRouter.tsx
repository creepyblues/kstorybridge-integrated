import { Routes, Route } from 'react-router-dom';
import { ToolsIndex } from './ToolsIndex';
import { TitleInvestigator } from './TitleInvestigator';
import { InvestigationDetail } from './InvestigationDetail';

/**
 * Sub-router for admin tools
 * All routes under /tools/*
 */
export function ToolsRouter() {
  return (
    <Routes>
      <Route index element={<ToolsIndex />} />
      <Route path="title-investigator" element={<TitleInvestigator />} />
      <Route path="intelligence/:id" element={<InvestigationDetail />} />
    </Routes>
  );
}
