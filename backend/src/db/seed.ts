import bcrypt from 'bcrypt';
import { memoryStore } from './index.js';
import { calculatePriorityScore } from '../services/priorityService.js';

export async function seedDatabase(targetStore: any = memoryStore) {
  console.log('🌱 Seeding DisasterOps RELIEF data...');

  const passwordHash = await bcrypt.hash('relief2026', 10);

  // Clear existing
  targetStore.users = [];
  targetStore.incidents = [];
  targetStore.incidentReports = [];
  targetStore.resourceCenters = [];
  targetStore.resourceStock = [];
  targetStore.shelters = [];
  targetStore.teams = [];
  targetStore.auditLogs = [];

  // 1. Users (4 Roles)
  const defaultUsers = [
    {
      id: targetStore.nextId('users'),
      name: 'Cpt. Rachel Torres',
      email: 'authority@relief.org',
      phone: '+1 (555) 019-2834',
      passwordHash,
      role: 'authority',
      skills: JSON.stringify(['incident_command', 'triage', 'disaster_operations']),
      latitude: 34.0522,
      longitude: -118.2437,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: targetStore.nextId('users'),
      name: 'Marcus Vance',
      email: 'resources@relief.org',
      phone: '+1 (555) 014-9982',
      passwordHash,
      role: 'resource_manager',
      skills: JSON.stringify(['logistics', 'supply_chain', 'inventory_allocation']),
      latitude: 34.0488,
      longitude: -118.2518,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: targetStore.nextId('users'),
      name: 'Priya Sharma, EMT-P',
      email: 'priya.volunteer@relief.org',
      phone: '+1 (555) 017-4321',
      passwordHash,
      role: 'volunteer',
      skills: JSON.stringify(['medical', 'paramedic', 'water_rescue', 'first_aid']),
      latitude: 34.0580,
      longitude: -118.2390,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: targetStore.nextId('users'),
      name: 'David Miller',
      email: 'david.volunteer@relief.org',
      phone: '+1 (555) 012-7788',
      passwordHash,
      role: 'volunteer',
      skills: JSON.stringify(['search_and_rescue', 'boat_operator', 'heavy_machinery']),
      latitude: 34.0620,
      longitude: -118.2480,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: targetStore.nextId('users'),
      name: 'Alex Chen',
      email: 'alex.volunteer@relief.org',
      phone: '+1 (555) 015-6622',
      passwordHash,
      role: 'volunteer',
      skills: JSON.stringify(['firefighting', 'hazmat', 'evacuation']),
      latitude: 34.0850,
      longitude: -118.3100,
      status: 'deployed',
      createdAt: new Date(),
    },
    {
      id: targetStore.nextId('users'),
      name: 'Maria Lopez',
      email: 'citizen@relief.org',
      phone: '+1 (555) 018-9901',
      passwordHash,
      role: 'citizen',
      skills: JSON.stringify([]),
      latitude: 34.0537,
      longitude: -118.2427,
      status: 'available',
      createdAt: new Date(),
    },
  ];
  targetStore.users.push(...defaultUsers);

  // 2. Teams
  const defaultTeams = [
    {
      id: targetStore.nextId('teams'),
      name: 'Alpha Team (Water Rescue)',
      captain: 'Lt. Mark Evans',
      specialty: 'flood_response',
      memberCount: 12,
      status: 'deployed',
      assignedZone: 'Riverside District (Zone 4)',
    },
    {
      id: targetStore.nextId('teams'),
      name: 'Bravo Team (Wildfire Suppression)',
      captain: 'Capt. Sarah Jenkins',
      specialty: 'wildfire_suppression',
      memberCount: 8,
      status: 'deployed',
      assignedZone: 'Eastwood Hills (Zone 2)',
    },
    {
      id: targetStore.nextId('teams'),
      name: 'Delta Team (Urban Search & Fire)',
      captain: 'Sgt. Frank Castle',
      specialty: 'structure_fire',
      memberCount: 5,
      status: 'deployed',
      assignedZone: 'Harbor Ave 1204 (Zone 5)',
    },
    {
      id: targetStore.nextId('teams'),
      name: 'Sub-unit C (Hazmat)',
      captain: 'Dr. Emily Watson',
      specialty: 'hazmat',
      memberCount: 3,
      status: 'deployed',
      assignedZone: 'Industrial Zone B',
    },
    {
      id: targetStore.nextId('teams'),
      name: 'Sub-unit E (Road Assessment)',
      captain: 'Insp. Daniel Craig',
      specialty: 'road_collapse',
      memberCount: 2,
      status: 'deployed',
      assignedZone: 'Highway 7 North',
    },
    {
      id: targetStore.nextId('teams'),
      name: 'Echo Team (Medical Rapid Response)',
      captain: 'Dr. Alan Grant',
      specialty: 'medical',
      memberCount: 6,
      status: 'standby',
      assignedZone: 'Metro Central Hub',
    },
  ];
  targetStore.teams.push(...defaultTeams);

  // 3. Incidents (matching screenshots)
  const now = Date.now();
  const rawIncidents = [
    {
      id: targetStore.nextId('incidents'),
      code: 'INC-0841',
      title: 'Riverside Flood',
      type: 'flood',
      severity: 'critical',
      description: 'Flash flooding reported along the Riverside basin following 3.8 in of rainfall. Residential zones 4A-4C partially submerged. Water rescue teams operational.',
      locationName: 'Riverside District',
      latitude: 34.0537,
      longitude: -118.2427,
      status: 'in_progress', // displayed as Active in overview
      reportCount: 6,
      trappedCount: 8,
      elderlyChildCount: 4,
      medicalEmergency: true,
      vulnerabilityScore: 9.5,
      resourceUrgencyScore: 9.0,
      assignedTeamId: defaultTeams[0].id,
      unitsDeployed: 12,
      icOfficer: 'Cpt. R. Torres',
      evacuationZone: 'Zone 4 active',
      estClearTime: '~4 hrs',
      clientCreatedAt: new Date(now - 14 * 60 * 1000), // 14 mins ago
      serverReceivedAt: new Date(now - 14 * 60 * 1000),
      updatedAt: new Date(now - 2 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidents'),
      code: 'INC-0840',
      title: 'Eastwood Hills Wildfire',
      type: 'wildfire',
      severity: 'high',
      description: 'Brush fire spreading northward along ridge due to 25mph gusting winds. Structure protection lines established around Ridgecrest drive.',
      locationName: 'Eastwood Hills',
      latitude: 34.0928,
      longitude: -118.3287,
      status: 'in_progress', // Active
      reportCount: 4,
      trappedCount: 0,
      elderlyChildCount: 2,
      medicalEmergency: false,
      vulnerabilityScore: 7.0,
      resourceUrgencyScore: 8.0,
      assignedTeamId: defaultTeams[1].id,
      unitsDeployed: 8,
      icOfficer: 'Capt. S. Jenkins',
      evacuationZone: 'Zone 2 advisory',
      estClearTime: '~6 hrs',
      clientCreatedAt: new Date(now - 52 * 60 * 1000), // 52 mins ago
      serverReceivedAt: new Date(now - 52 * 60 * 1000),
      updatedAt: new Date(now - 10 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidents'),
      code: 'INC-0839',
      title: 'Structure Fire — Harbor Commercial Area',
      type: 'structure_fire',
      severity: 'high',
      description: 'Commercial warehouse interior fire contained to second floor. No hazardous chemical storage involved. Ventilation completed.',
      locationName: 'Harbor Ave 1204',
      latitude: 33.7432,
      longitude: -118.2673,
      status: 'contained',
      reportCount: 3,
      trappedCount: 0,
      elderlyChildCount: 0,
      medicalEmergency: false,
      vulnerabilityScore: 5.0,
      resourceUrgencyScore: 6.5,
      assignedTeamId: defaultTeams[2].id,
      unitsDeployed: 5,
      icOfficer: 'Sgt. F. Castle',
      evacuationZone: 'None',
      estClearTime: '~1.5 hrs',
      clientCreatedAt: new Date(now - 60 * 60 * 1000), // 1 hr ago
      serverReceivedAt: new Date(now - 60 * 60 * 1000),
      updatedAt: new Date(now - 15 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidents'),
      code: 'INC-0838',
      title: 'Gas Leak — Industrial Zone B',
      type: 'gas_leak',
      severity: 'moderate',
      description: 'Strong smell of mercaptan gas near pipeline junction. Utility main valve isolated. Area ventilation and atmosphere monitoring underway.',
      locationName: 'Industrial Zone B',
      latitude: 34.0150,
      longitude: -118.1900,
      status: 'contained',
      reportCount: 2,
      trappedCount: 0,
      elderlyChildCount: 0,
      medicalEmergency: false,
      vulnerabilityScore: 4.0,
      resourceUrgencyScore: 5.0,
      assignedTeamId: defaultTeams[3].id,
      unitsDeployed: 3,
      icOfficer: 'Dr. E. Watson',
      evacuationZone: 'Perimeter 200m',
      estClearTime: '~1 hr',
      clientCreatedAt: new Date(now - 120 * 60 * 1000), // 2 hrs ago
      serverReceivedAt: new Date(now - 120 * 60 * 1000),
      updatedAt: new Date(now - 30 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidents'),
      code: 'INC-0837',
      title: 'Road Collapse & Sinkhole',
      type: 'road_collapse',
      severity: 'moderate',
      description: 'Large sinkhole appeared in asphalt road, approximately 2m wide following heavy storm run-off. Both traffic lanes blocked.',
      locationName: 'Park Blvd & Oakwood Ave',
      latitude: 34.0700,
      longitude: -118.2900,
      status: 'verified', // Monitoring
      reportCount: 2,
      trappedCount: 0,
      elderlyChildCount: 0,
      medicalEmergency: false,
      vulnerabilityScore: 3.5,
      resourceUrgencyScore: 4.0,
      assignedTeamId: defaultTeams[4].id,
      unitsDeployed: 2,
      icOfficer: 'Insp. D. Craig',
      evacuationZone: 'Traffic Detour',
      estClearTime: '~8 hrs',
      clientCreatedAt: new Date(now - 180 * 60 * 1000), // 3 hrs ago
      serverReceivedAt: new Date(now - 180 * 60 * 1000),
      updatedAt: new Date(now - 45 * 60 * 1000),
    },
  ];

  // Calculate priority scores using formula
  for (const inc of rawIncidents) {
    const pCalc = calculatePriorityScore({
      severity: inc.severity,
      createdAt: inc.clientCreatedAt,
      vulnerabilityScore: inc.vulnerabilityScore,
      trappedCount: inc.trappedCount,
      elderlyChildCount: inc.elderlyChildCount,
      medicalEmergency: inc.medicalEmergency,
      resourceUrgencyScore: inc.resourceUrgencyScore,
      reportCount: inc.reportCount,
    });
    (inc as any).priorityScore = pCalc.totalScore;
    targetStore.incidents.push(inc);
  }

  // 4. Linked Corroborations
  const sampleReports = [
    {
      id: targetStore.nextId('incidentReports'),
      incidentId: rawIncidents[0].id,
      reporterName: 'Maria L. (RPT-014)',
      reporterPhone: '+1 (555) 018-9901',
      type: 'flood',
      severity: 'high',
      description: 'Street completely submerged, water reaching front doors. 3 families unable to leave on Elm St & 5th Ave.',
      locationName: 'Elm St & 5th Ave, Riverside District',
      latitude: 34.0540,
      longitude: -118.2430,
      clientCreatedAt: new Date(now - 6 * 60 * 1000),
      serverReceivedAt: new Date(now - 6 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidentReports'),
      incidentId: rawIncidents[4].id,
      reporterName: 'James K. (RPT-013)',
      reporterPhone: '+1 (555) 016-3399',
      type: 'road_collapse',
      severity: 'moderate',
      description: 'Large sinkhole appeared in road, about 2m wide. Traffic blocked both directions.',
      locationName: 'Park Blvd near Oakwood',
      latitude: 34.0702,
      longitude: -118.2895,
      clientCreatedAt: new Date(now - 31 * 60 * 1000),
      serverReceivedAt: new Date(now - 31 * 60 * 1000),
    },
    {
      id: targetStore.nextId('incidentReports'),
      incidentId: rawIncidents[3].id,
      reporterName: 'Priya N. (RPT-012)',
      reporterPhone: '+1 (555) 013-1122',
      type: 'gas_leak',
      severity: 'critical',
      description: 'Strong smell of gas near warehouse row. Two workers already evacuated.',
      locationName: 'Industrial Zone C Warehouse Row',
      latitude: 34.0155,
      longitude: -118.1905,
      clientCreatedAt: new Date(now - 60 * 60 * 1000),
      serverReceivedAt: new Date(now - 60 * 60 * 1000),
    },
  ];
  targetStore.incidentReports.push(...sampleReports);

  // 5. Resource Centers
  const defaultCenters = [
    {
      id: targetStore.nextId('resourceCenters'),
      name: 'Metro Central Logistics Hub',
      locationName: 'Downtown Metro, Zone 1',
      latitude: 34.0488,
      longitude: -118.2518,
      contactPhone: '+1 (555) 014-9982',
      zone: 'Zone 1',
    },
    {
      id: targetStore.nextId('resourceCenters'),
      name: 'Eastwood Valley Emergency Depot',
      locationName: 'Eastwood Foothills, Zone 2',
      latitude: 34.0900,
      longitude: -118.3200,
      contactPhone: '+1 (555) 019-4411',
      zone: 'Zone 2',
    },
    {
      id: targetStore.nextId('resourceCenters'),
      name: 'Harborside Resource Staging Facility',
      locationName: 'Harbor Coastal Terminal, Zone 5',
      latitude: 33.7450,
      longitude: -118.2600,
      contactPhone: '+1 (555) 011-8899',
      zone: 'Zone 5',
    },
  ];
  targetStore.resourceCenters.push(...defaultCenters);

  // 6. Resource Stock (Matching screenshot metrics)
  const defaultStock = [
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'fire_units',
      itemName: 'Fire & Rescue Trucks',
      category: 'fire',
      quantity: 14,
      maxCapacity: 22,
      unit: 'active units',
      status: 'deployed',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'medical_teams',
      itemName: 'Advanced Life Support Ambulances',
      category: 'medical',
      quantity: 9,
      maxCapacity: 12,
      unit: 'teams deployed',
      status: 'deployed',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'search_rescue',
      itemName: 'Search & Rescue Units (K9 + Sonar)',
      category: 'rescue',
      quantity: 4,
      maxCapacity: 8,
      unit: 'squads deployed',
      status: 'deployed',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'hazmat',
      itemName: 'Hazmat Containment Units',
      category: 'hazmat',
      quantity: 3,
      maxCapacity: 4,
      unit: 'units deployed',
      status: 'deployed',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'aerial_support',
      itemName: 'Helicopter & Drone Aerial Spotters',
      category: 'life_support',
      quantity: 2,
      maxCapacity: 3,
      unit: 'craft deployed',
      status: 'deployed',
    },
    // Supplies inventory
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'water_boats',
      itemName: 'Inflatable Water Rescue Boats',
      category: 'rescue',
      quantity: 18,
      maxCapacity: 25,
      unit: 'vessels',
      status: 'in_stock',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'medical_kits',
      itemName: 'Field Trauma Medical Kits (Level 3)',
      category: 'medical',
      quantity: 85,
      maxCapacity: 120,
      unit: 'kits',
      status: 'in_stock',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'generators',
      itemName: 'Emergency 10kW Mobile Generators',
      category: 'life_support',
      quantity: 24,
      maxCapacity: 30,
      unit: 'generators',
      status: 'in_stock',
    },
    {
      id: targetStore.nextId('resourceStock'),
      centerId: defaultCenters[0].id,
      itemType: 'food_rations',
      itemName: 'Emergency Rations (72h Family Packs)',
      category: 'life_support',
      quantity: 1450,
      maxCapacity: 2000,
      unit: 'packs',
      status: 'in_stock',
    },
  ];
  targetStore.resourceStock.push(...defaultStock);

  // 7. Shelters
  const defaultShelters = [
    {
      id: targetStore.nextId('shelters'),
      name: 'Riverside Community High School Shelter',
      locationName: 'Riverside District, Zone 4',
      latitude: 34.0510,
      longitude: -118.2380,
      capacity: 350,
      occupancy: 280,
      isActive: true,
      hasMedical: true,
      hasFood: true,
      hasPower: true,
      contactPhone: '+1 (555) 019-3388',
      address: '1420 River Road, Riverside Basin',
    },
    {
      id: targetStore.nextId('shelters'),
      name: 'Metro Civic Auditorium & Relief Center',
      locationName: 'Downtown Metro, Zone 1',
      latitude: 34.0450,
      longitude: -118.2550,
      capacity: 800,
      occupancy: 410,
      isActive: true,
      hasMedical: true,
      hasFood: true,
      hasPower: true,
      contactPhone: '+1 (555) 017-7722',
      address: '500 Grand Avenue, Downtown Metro',
    },
    {
      id: targetStore.nextId('shelters'),
      name: 'North Valley Sports Complex Shelter',
      locationName: 'North Valley, Zone 3',
      latitude: 34.0980,
      longitude: -118.3150,
      capacity: 1200,
      occupancy: 620,
      isActive: true,
      hasMedical: true,
      hasFood: true,
      hasPower: true,
      contactPhone: '+1 (555) 012-9900',
      address: '8800 Valley Blvd, North District',
    },
    {
      id: targetStore.nextId('shelters'),
      name: 'Harborside Evacuation Point',
      locationName: 'Harbor Zone 5',
      latitude: 33.7400,
      longitude: -118.2700,
      capacity: 250,
      occupancy: 245,
      isActive: true,
      hasMedical: true,
      hasFood: true,
      hasPower: true,
      contactPhone: '+1 (555) 015-1100',
      address: '120 Coastal Way, Harbor District',
    },
  ];
  targetStore.shelters.push(...defaultShelters);

  // 8. Activity Logs
  const sampleLogs = [
    {
      id: targetStore.nextId('auditLogs'),
      userName: 'Cpt. Rachel Torres',
      action: 'DISPATCH_UNITS',
      targetType: 'incident',
      targetId: 'INC-0841',
      details: '12 units dispatched to Riverside District (Alpha Water Rescue Team)',
      timestamp: new Date(now - 14 * 60 * 1000),
    },
    {
      id: targetStore.nextId('auditLogs'),
      userName: 'System Corroboration Engine',
      action: 'CORROBORATION_LINK',
      targetType: 'incident',
      targetId: 'INC-0841',
      details: 'Linked report RPT-014 from Maria L. (+1 report count, updated priority to 8.75)',
      timestamp: new Date(now - 6 * 60 * 1000),
    },
    {
      id: targetStore.nextId('auditLogs'),
      userName: 'Marcus Vance',
      action: 'STOCK_ALLOCATION',
      targetType: 'resource',
      targetId: 'RC-01',
      details: 'Allocated 18 Inflatable Rescue Boats to Riverside Staging Point',
      timestamp: new Date(now - 25 * 60 * 1000),
    },
    {
      id: targetStore.nextId('auditLogs'),
      userName: 'Capt. Sarah Jenkins',
      action: 'STATUS_CHANGE',
      targetType: 'incident',
      targetId: 'INC-0840',
      details: 'Updated status of Eastwood Hills Wildfire to ACTIVE with structure barrier set',
      timestamp: new Date(now - 40 * 60 * 1000),
    },
  ];
  targetStore.auditLogs.push(...sampleLogs);

  console.log(`✅ Database seeded successfully: ${targetStore.incidents.length} incidents, ${targetStore.users.length} users, ${targetStore.shelters.length} shelters, ${targetStore.resourceStock.length} resource items.`);
}

// Run immediately when executed directly
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}
