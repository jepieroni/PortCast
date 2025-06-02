
export const getShipmentTypeColor = (type: string) => {
  switch (type) {
    case 'inbound': return 'bg-blue-500';
    case 'outbound': return 'bg-green-500';
    case 'intertheater': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

export const getCubeDisplayValue = (shipment: any) => {
  // If remaining_cube exists, use it
  if (shipment.remaining_cube !== null && shipment.remaining_cube !== undefined) {
    return `${shipment.remaining_cube} cuft`;
  }
  
  // If only estimated_cube is available, use it with "(Estimated)" indicator
  if (shipment.estimated_cube !== null && shipment.estimated_cube !== undefined) {
    return `${shipment.estimated_cube} cuft (Estimated)`;
  }
  
  // Fallback
  return '0 cuft';
};
