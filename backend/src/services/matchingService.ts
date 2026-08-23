import { calculateHaversineDistance } from './dedupService.js';

export interface VolunteerCandidate {
  id: number;
  name: string;
  phone: string;
  role: string;
  skills: string[] | string; // e.g. ['medical', 'first_aid', 'water_rescue']
  latitude?: number;
  longitude?: number;
  status: string; // 'available' | 'deployed' | 'busy' | 'offline'
}

export interface IncidentForMatching {
  id: number;
  code: string;
  title: string;
  type: string;
  severity: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface MatchEvaluation {
  volunteerId: number;
  volunteerName: string;
  phone: string;
  status: string;
  skills: string[];
  distanceKm: number;
  skillMatchCount: number;
  matchedSkills: string[];
  matchScore: number; // 0 - 100
  isRecommended: boolean;
  scoreBreakdown: {
    skillScore: number; // max 40
    distanceScore: number; // max 35
    availabilityScore: number; // max 15
    priorityScore: number; // max 10
  };
  explanation: string;
}

export const INCIDENT_SKILL_MAP: Record<string, string[]> = {
  flood: ['water_rescue', 'boat_operator', 'logistics', 'first_aid'],
  wildfire: ['firefighting', 'wildfire_suppression', 'evacuation', 'first_aid'],
  structure_fire: ['firefighting', 'search_and_rescue', 'first_aid'],
  gas_leak: ['hazmat', 'evacuation', 'first_aid'],
  chemical_spill: ['hazmat', 'chemical_safety', 'first_aid'],
  landslide: ['search_and_rescue', 'heavy_machinery', 'first_aid'],
  road_collapse: ['traffic_control', 'logistics', 'search_and_rescue'],
  medical: ['medical', 'paramedic', 'first_aid', 'triage'],
  civil_unrest: ['crowd_control', 'first_aid', 'logistics'],
  shelter: ['shelter_management', 'food_distribution', 'counseling'],
  food: ['logistics', 'distribution', 'inventory'],
  water: ['water_purification', 'logistics', 'distribution'],
  other: ['first_aid', 'general_volunteer', 'logistics'],
};

export function getRequiredSkills(incidentType: string): string[] {
  const norm = incidentType.toLowerCase().replace(/[^a-z_]/g, '');
  for (const [key, skills] of Object.entries(INCIDENT_SKILL_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return skills;
    }
  }
  return ['first_aid', 'general_volunteer', 'logistics'];
}

export function matchVolunteersForIncident(
  incident: IncidentForMatching,
  volunteers: VolunteerCandidate[]
): MatchEvaluation[] {
  const requiredSkills = getRequiredSkills(incident.type);

  const evaluations: MatchEvaluation[] = volunteers
    .filter(v => v.role === 'volunteer' && v.status !== 'offline')
    .map(vol => {
      // Parse skills
      let volSkills: string[] = [];
      if (Array.isArray(vol.skills)) {
        volSkills = vol.skills.map(s => s.toLowerCase());
      } else if (typeof vol.skills === 'string') {
        try {
          const parsed = JSON.parse(vol.skills);
          volSkills = Array.isArray(parsed) ? parsed.map((s: string) => s.toLowerCase()) : [vol.skills.toLowerCase()];
        } catch {
          volSkills = vol.skills.split(',').map(s => s.trim().toLowerCase());
        }
      }

      // 1. Skill Match Score (Max 40 pts)
      const matchedSkills = requiredSkills.filter(req =>
        volSkills.some(vs => vs.includes(req) || req.includes(vs))
      );
      const skillRatio = requiredSkills.length > 0 ? Math.min(1, matchedSkills.length / Math.min(2, requiredSkills.length)) : 0.5;
      const skillScore = Math.round(skillRatio * 40 * 10) / 10;

      // 2. Distance Score (Max 35 pts)
      let distanceKm = 10;
      if (vol.latitude !== undefined && vol.longitude !== undefined) {
        const distMeters = calculateHaversineDistance(
          { latitude: vol.latitude, longitude: vol.longitude },
          { latitude: incident.latitude, longitude: incident.longitude }
        );
        distanceKm = Math.round((distMeters / 1000) * 10) / 10;
      }
      const distRatio = Math.max(0, 1 - Math.min(distanceKm, 50) / 50); // 0km = 1.0, 50km = 0
      const distanceScore = Math.round(distRatio * 35 * 10) / 10;

      // 3. Availability Score (Max 15 pts)
      let availabilityScore = 5;
      if (vol.status === 'available') availabilityScore = 15;
      else if (vol.status === 'standby') availabilityScore = 10;
      else if (vol.status === 'deployed') availabilityScore = 2;

      // 4. Task Priority urgency weight (Max 10 pts)
      const priorityRatio = Math.min(10, Math.max(0, incident.priorityScore || 5.0)) / 10;
      const priorityBonus = Math.round(priorityRatio * 10 * 10) / 10;

      const totalScore = Math.round((skillScore + distanceScore + availabilityScore + priorityBonus) * 10) / 10;

      return {
        volunteerId: vol.id,
        volunteerName: vol.name,
        phone: vol.phone,
        status: vol.status,
        skills: volSkills,
        distanceKm,
        skillMatchCount: matchedSkills.length,
        matchedSkills,
        matchScore: totalScore,
        isRecommended: false,
        scoreBreakdown: {
          skillScore,
          distanceScore,
          availabilityScore,
          priorityScore: priorityBonus,
        },
        explanation: `${matchedSkills.length > 0 ? `Matched skills: ${matchedSkills.join(', ')}` : 'General support'} · ${distanceKm} km away · ${vol.status.toUpperCase()}`,
      };
    });

  // Sort descending by match score
  evaluations.sort((a, b) => b.matchScore - a.matchScore);

  if (evaluations.length > 0) {
    evaluations[0].isRecommended = true;
  }

  return evaluations;
}
