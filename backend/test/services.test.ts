import { calculatePriorityScore, normalizeSeverity } from '../src/services/priorityService.js';
import { checkDuplicate, calculateHaversineDistance } from '../src/services/dedupService.js';
import { matchVolunteersForIncident, getRequiredSkills } from '../src/services/matchingService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail || '');
    failed++;
  }
}

console.log('🧪 Starting DisasterOps Rule-Based Services Test Suite...\n');

// 1. Test Priority Scoring Formula
console.log('--- 1. Testing Priority Scoring Formula (Locked Rule) ---');
{
  // Test Normalized Severity
  assert(normalizeSeverity('critical') === 10.0, 'Critical severity normalizes to 10.0');
  assert(normalizeSeverity('high') === 7.5, 'High severity normalizes to 7.5');
  assert(normalizeSeverity('moderate') === 5.0, 'Moderate severity normalizes to 5.0');
  assert(normalizeSeverity('low') === 2.5, 'Low severity normalizes to 2.5');

  // Test Formula with known inputs
  // Priority = (0.35 × S) + (0.20 × TW) + (0.20 × V) + (0.15 × RU) + (0.10 × RC)
  const now = Date.now();
  const testInputs = {
    severity: 'critical', // 10.0 -> 0.35 * 10 = 3.5
    createdAt: new Date(now - 90 * 60 * 1000), // 90 min elapsed / 180 min * 10 = 5.0 -> 0.20 * 5.0 = 1.0
    vulnerabilityScore: 8.0, // -> 0.20 * 8.0 = 1.6
    resourceUrgencyScore: 6.0, // -> 0.15 * 6.0 = 0.9
    reportCount: 5, // 5.0 -> 0.10 * 5.0 = 0.5
  };
  // Expected = 3.5 + 1.0 + 1.6 + 0.9 + 0.5 = 7.50
  const result = calculatePriorityScore(testInputs);
  assert(
    Math.abs(result.totalScore - 7.50) < 0.05,
    `Priority calculation exact weighted result (Expected ~7.50, Got ${result.totalScore})`
  );
  assert(result.totalScore <= 10.0 && result.totalScore >= 0.0, 'Priority score stays within [0.0, 10.0] bounds');
}

// 2. Test Spatial / Temporal Deduplication and Corroboration
console.log('\n--- 2. Testing Spatial/Temporal Deduplication & Corroboration Engine ---');
{
  // Distance between two points in Riverside (approx 110m apart)
  const pt1 = { latitude: 34.0537, longitude: -118.2427 };
  const pt2 = { latitude: 34.0545, longitude: -118.2432 };
  const distance = calculateHaversineDistance(pt1, pt2);
  assert(distance > 0 && distance < 200, `Haversine distance calculated accurately (${distance}m apart)`);

  const openIncidents = [
    {
      id: 1,
      code: 'INC-0841',
      type: 'flood',
      severity: 'critical',
      latitude: 34.0537,
      longitude: -118.2427,
      status: 'in_progress',
      reportCount: 1,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  // Case A: Near distance + recent time + same category => SHOULD CORROBORATE
  const nearReport = {
    type: 'flood',
    latitude: 34.0540,
    longitude: -118.2430,
    clientCreatedAt: new Date(),
  };
  const dedupMatch = checkDuplicate(nearReport, openIncidents as any);
  assert(dedupMatch.isDuplicate === true, 'Corroboration matches near flood report within 200m & 12h');
  assert(dedupMatch.canonicalIncident?.code === 'INC-0841', 'Matches canonical incident INC-0841');

  // Case B: Far distance (> 2km) => SHOULD NOT CORROBORATE
  const farReport = {
    type: 'flood',
    latitude: 34.0800,
    longitude: -118.2900,
    clientCreatedAt: new Date(),
  };
  const dedupFar = checkDuplicate(farReport, openIncidents as any);
  assert(dedupFar.isDuplicate === false, 'Far report (>2km) creates independent incident');

  // Case C: Different category at same location => SHOULD NOT CORROBORATE
  const diffCategory = {
    type: 'gas_leak',
    latitude: 34.0537,
    longitude: -118.2427,
    clientCreatedAt: new Date(),
  };
  const dedupDiff = checkDuplicate(diffCategory, openIncidents as any);
  assert(dedupDiff.isDuplicate === false, 'Different threat type does not false-match');
}

// 3. Test Volunteer Matching Engine
console.log('\n--- 3. Testing Volunteer Multi-Factor Matching Algorithm ---');
{
  const testIncident = {
    id: 1,
    code: 'INC-0841',
    title: 'Riverside Flood',
    type: 'flood',
    severity: 'critical',
    priorityScore: 8.5,
    latitude: 34.0537,
    longitude: -118.2427,
    locationName: 'Riverside District',
  };

  const volunteers = [
    {
      id: 101,
      name: 'Priya (Paramedic & Water Rescue)',
      phone: '555-0101',
      role: 'volunteer',
      skills: ['water_rescue', 'medical', 'paramedic'],
      latitude: 34.0540, // very close ~50m
      longitude: -118.2430,
      status: 'available',
    },
    {
      id: 102,
      name: 'Bob (General)',
      phone: '555-0102',
      role: 'volunteer',
      skills: ['general_volunteer'],
      latitude: 34.0900, // ~4km away
      longitude: -118.3000,
      status: 'available',
    },
    {
      id: 103,
      name: 'Charlie (Busy)',
      phone: '555-0103',
      role: 'volunteer',
      skills: ['water_rescue'],
      latitude: 34.0537,
      longitude: -118.2427,
      status: 'deployed',
    },
  ];

  const matches = matchVolunteersForIncident(testIncident, volunteers);
  assert(matches.length > 0, 'Returns candidate match evaluations');
  assert(matches[0].volunteerId === 101, 'Top recommended volunteer is nearest available with matching skills');
  assert(matches[0].isRecommended === true, 'Top candidate is flagged as isRecommended');
  assert(matches[0].matchScore > matches[1].matchScore, 'Skill match + proximity score outranks non-matching volunteer');
}

console.log(`\n======================================================`);
console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed.`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
