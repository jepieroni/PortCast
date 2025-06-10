
import { ExtendedConsolidationGroup } from './dragDropTypes';
import { CustomConsolidationGroup } from '../useCustomConsolidations';

export const getCardKey = (card: ExtendedConsolidationGroup): string => {
  if ('is_custom' in card && card.is_custom) {
    return (card as CustomConsolidationGroup).custom_id;
  }
  return `${card.poe_id}-${card.pod_id}`;
};
