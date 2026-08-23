export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface IncidentMatchCandidate {
  id: number;
  code: string;
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
  status: string; // reported | verified | assigned | in_progress
  reportCount: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface DedupCheckResult {
  isDuplicate: boolean;
  canonicalIncident?: IncidentMatchCandidate;
  distanceMeters?: number;
  hoursElapsed?: number;
  matchReasons: string[];
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistance(pt1: GeoPoint, pt2: GeoPoint): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (pt1.latitude * Math.PI) / 180;
  const lat2Rad = (pt2.latitude * Math.PI) / 180;
  const deltaLatRad = ((pt2.latitude - pt1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((pt2.longitude - pt1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Evaluates whether a new incident report is a spatial/temporal duplicate/corroboration of an open incident.
 * Radius: 200m (or up to 500m if accuracy is low)
 * Time window: 12 hours rolling
 * Incident type: exact or related category match
 */
export function checkDuplicate(
  newReport: {
    type: string;
    latitude: number;
    longitude: number;
    clientCreatedAt?: Date | string;
    accuracyMeters?: number;
  },
  openIncidents: IncidentMatchCandidate[]
): DedupCheckResult {
  const maxRadiusMeters = newReport.accuracyMeters && newReport.accuracyMeters > 50 ? 500 : 250;
  const maxTimeWindowHours = 12;
  const now = new Date(newReport.clientCreatedAt || Date.now()).getTime();

  for (const inc of openIncidents) {
    // Only check open/active incidents (not resolved/contained)
    if (['resolved', 'contained'].includes(inc.status.toLowerCase())) {
      continue;
    }

    // 1. Category check
    const type1 = newReport.type.toLowerCase().replace(/[^a-z]/g, '');
    const type2 = inc.type.toLowerCase().replace(/[^a-z]/g, '');
    const isTypeMatch = type1 === type2 || type1.includes(type2) || type2.includes(type1);

    if (!isTypeMatch) {
      continue;
    }

    // 2. Spatial check
    const distanceMeters = calculateHaversineDistance(
      { latitude: newReport.latitude, longitude: newReport.longitude },
      { latitude: inc.latitude, longitude: inc.longitude }
    );

    if (distanceMeters > maxRadiusMeters) {
      continue;
    }

    // 3. Temporal check (within 12 hours of creation or latest update)
    const incTime = new Date(inc.updatedAt || inc.createdAt).getTime();
    const hoursElapsed = Math.abs(now - incTime) / (1000 * 60 * 60);

    if (hoursElapsed > maxTimeWindowHours) {
      continue;
    }

    // Match confirmed!
    return {
      isDuplicate: true,
      canonicalIncident: inc,
      distanceMeters,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      matchReasons: [
        `Spatial match: ${distanceMeters}m apart (<= ${maxRadiusMeters}m threshold)`,
        `Temporal match: within ${Math.round(hoursElapsed * 10) / 10} hours (<= ${maxTimeWindowHours}h window)`,
        `Category match: ${newReport.type} matches open ${inc.type} incident (${inc.code})`,
      ],
    };
  }

  return {
    isDuplicate: false,
    matchReasons: ['No open incident matched spatial, temporal, and category criteria simultaneously.'],
  };
}
