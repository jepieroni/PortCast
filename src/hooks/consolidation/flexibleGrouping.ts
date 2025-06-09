// This file has been backed up to flexibleGrouping.backup.ts
// Placeholder for future flexible grouping implementation

import { ConsolidationGroup, ShipmentData } from './types';

export function processFlexibleGrouping(
  shipments: ShipmentData[], 
  userId: string, 
  flexibilitySettings: any
): ConsolidationGroup[] {
  // Temporary: redirect to strict grouping until new strategy is implemented
  const { processStrictGrouping } = require('./strictGrouping');
  return processStrictGrouping(shipments, userId);
}
