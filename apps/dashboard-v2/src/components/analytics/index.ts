/**
 * Analytics Components Barrel Export
 *
 * Centralized exports for all analytics dashboard components.
 * These components are for internal use by the product team to monitor
 * user journey funnels, retention, and conversion metrics.
 *
 * @module analytics
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

export { FunnelVisualization } from './FunnelVisualization';
export type { FunnelStep } from './FunnelVisualization';

export { FunnelMetrics } from './FunnelMetrics';
export type { MetricData } from './FunnelMetrics';

export { CohortDashboard } from './CohortDashboard';
export type { CohortData } from './CohortDashboard';

/**
 * Usage example:
 *
 * import {
 *   FunnelVisualization,
 *   FunnelMetrics,
 *   CohortDashboard,
 *   type FunnelStep,
 *   type MetricData,
 *   type CohortData,
 * } from '@/components/analytics';
 */
