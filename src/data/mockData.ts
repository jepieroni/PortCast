
export const mockConsolidationData = {
  inbound: [
    { country: 'Japan', totalCube: 850, poe: 'Norfolk', availableShipments: 12, hasUserShipments: true },
    { country: 'Germany', totalCube: 1200, poe: 'Baltimore', availableShipments: 8, hasUserShipments: false },
    { country: 'Italy', totalCube: 450, poe: 'Savannah', availableShipments: 6, hasUserShipments: true }
  ],
  outbound: [
    { country: 'South Korea', totalCube: 950, poe: 'Tacoma', availableShipments: 15, hasUserShipments: true },
    { country: 'United Kingdom', totalCube: 680, poe: 'Norfolk', availableShipments: 9, hasUserShipments: false },
    { country: 'Spain', totalCube: 320, poe: 'Jacksonville', availableShipments: 4, hasUserShipments: false }
  ],
  intertheater: [
    { origin: 'Germany', destination: 'Japan', totalCube: 560, availableShipments: 7, hasUserShipments: true },
    { origin: 'Italy', destination: 'South Korea', totalCube: 380, availableShipments: 5, hasUserShipments: false }
  ]
};

export const mainDashboardCards = [
  { id: 'inbound', title: 'Inbound', description: 'OCONUS to CONUS shipments', color: 'bg-blue-600' },
  { id: 'outbound', title: 'Outbound', description: 'CONUS to OCONUS shipments', color: 'bg-emerald-600' },
  { id:'intertheater', title: 'Intertheater', description: 'OCONUS to OCONUS shipments', color: 'bg-purple-600' }
];
