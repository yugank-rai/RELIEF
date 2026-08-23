import { Router, Response } from 'express';
import { z } from 'zod';
import { memoryStore } from '../db/index.js';
import { optionalAuth, authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { calculatePriorityScore, normalizeSeverity } from '../services/priorityService.js';
import { checkDuplicate } from '../services/dedupService.js';
import { matchVolunteersForIncident } from '../services/matchingService.js';

const router = Router();

const ReportIncidentSchema = z.object({
  type: z.string().min(2),
  severity: z.string().min(2),
  description: z.string().min(5),
  locationName: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  accuracyMeters: z.number().optional(),
  trappedCount: z.number().optional().default(0),
  elderlyChildCount: z.number().optional().default(0),
  medicalEmergency: z.boolean().optional().default(false),
  resourceUrgencyScore: z.number().optional().default(5.0),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  clientCreatedAt: z.string().optional(),
});

// Helper to generate incident code INC-XXXX
function generateIncidentCode(): string {
  const num = 842 + memoryStore.incidents.length;
  return `INC-0${num}`;
}

// 1. List all incidents
router.get('/', (req, res) => {
  const { status, severity, type, search } = req.query;

  let results = memoryStore.incidents.map(inc => {
    // Recalculate priority score dynamically to reflect TimeWaiting in real time
    const pCalc = calculatePriorityScore({
      severity: inc.severity,
      createdAt: inc.clientCreatedAt || inc.serverReceivedAt,
      vulnerabilityScore: inc.vulnerabilityScore,
      trappedCount: inc.trappedCount,
      elderlyChildCount: inc.elderlyChildCount,
      medicalEmergency: inc.medicalEmergency,
      resourceUrgencyScore: inc.resourceUrgencyScore,
      reportCount: inc.reportCount,
    });
    return {
      ...inc,
      priorityScore: pCalc.totalScore,
      priorityBreakdown: pCalc,
    };
  });

  // Filter by status tab
  if (status && typeof status === 'string' && status !== 'all') {
    const s = status.toLowerCase();
    if (s === 'critical' || s === 'high' || s === 'moderate') {
      results = results.filter(i => i.severity.toLowerCase() === s);
    } else if (s === 'active') {
      results = results.filter(i => ['in_progress', 'reported', 'verified', 'assigned'].includes(i.status.toLowerCase()));
    } else if (s === 'contained') {
      results = results.filter(i => i.status.toLowerCase() === 'contained');
    } else if (s === 'monitoring') {
      results = results.filter(i => ['verified', 'monitoring'].includes(i.status.toLowerCase()));
    } else {
      results = results.filter(i => i.status.toLowerCase() === s);
    }
  }

  // Filter by search query
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      i =>
        i.title.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.locationName.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)
    );
  }

  // Sort descending by priority score
  results.sort((a, b) => b.priorityScore - a.priorityScore);

  res.json(results);
});

// 2. Get single incident by ID or code
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const incident = memoryStore.incidents.find(
    i => i.id === Number(id) || i.code.toLowerCase() === id.toLowerCase()
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  // Recalculate priority
  const priorityBreakdown = calculatePriorityScore({
    severity: incident.severity,
    createdAt: incident.clientCreatedAt,
    vulnerabilityScore: incident.vulnerabilityScore,
    trappedCount: incident.trappedCount,
    elderlyChildCount: incident.elderlyChildCount,
    medicalEmergency: incident.medicalEmergency,
    resourceUrgencyScore: incident.resourceUrgencyScore,
    reportCount: incident.reportCount,
  });

  // Get linked corroboration reports
  const reports = memoryStore.incidentReports.filter(r => r.incidentId === incident.id);

  // Get assigned team or volunteer details
  const team = incident.assignedTeamId
    ? memoryStore.teams.find(t => t.id === incident.assignedTeamId)
    : null;
  const volunteer = incident.assignedVolunteerId
    ? memoryStore.users.find(u => u.id === incident.assignedVolunteerId)
    : null;

  // Get recent audit logs for this incident
  const logs = memoryStore.auditLogs.filter(
    l => l.targetId === incident.code || l.targetId === String(incident.id)
  );

  res.json({
    ...incident,
    priorityScore: priorityBreakdown.totalScore,
    priorityBreakdown,
    reports,
    assignedTeam: team,
    assignedVolunteer: volunteer
      ? {
          id: volunteer.id,
          name: volunteer.name,
          phone: volunteer.phone,
          skills: typeof volunteer.skills === 'string' ? JSON.parse(volunteer.skills || '[]') : volunteer.skills,
        }
      : null,
    activityLogs: logs,
  });
});

// 3. Create / Report Incident (Citizen or Authority, online or synced)
router.post('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const parseResult = ReportIncidentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
  }

  const data = parseResult.data;
  const serverReceivedAt = new Date();
  const clientCreatedAt = data.clientCreatedAt ? new Date(data.clientCreatedAt) : serverReceivedAt;

  // Check for duplication/corroboration against OPEN incidents
  const openIncidents = memoryStore.incidents.filter(
    i => !['resolved', 'contained'].includes(i.status.toLowerCase())
  );

  const dedupResult = checkDuplicate(
    {
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      clientCreatedAt,
      accuracyMeters: data.accuracyMeters,
    },
    openIncidents as any
  );

  if (dedupResult.isDuplicate && dedupResult.canonicalIncident) {
    // CORROBORATION MATCH! Do NOT discard.
    const canonical = memoryStore.incidents.find(i => i.id === dedupResult.canonicalIncident!.id)!;
    canonical.reportCount += 1;
    canonical.updatedAt = serverReceivedAt;

    // Boost vulnerability/urgency if reporter indicates higher distress
    if (data.trappedCount && data.trappedCount > (canonical.trappedCount || 0)) {
      canonical.trappedCount = (canonical.trappedCount || 0) + data.trappedCount;
    }
    if (data.medicalEmergency) {
      canonical.medicalEmergency = true;
    }

    // Recalculate priority score
    const pCalc = calculatePriorityScore({
      severity: canonical.severity,
      createdAt: canonical.clientCreatedAt,
      vulnerabilityScore: canonical.vulnerabilityScore,
      trappedCount: canonical.trappedCount,
      elderlyChildCount: canonical.elderlyChildCount,
      medicalEmergency: canonical.medicalEmergency,
      resourceUrgencyScore: canonical.resourceUrgencyScore,
      reportCount: canonical.reportCount,
    });
    canonical.priorityScore = pCalc.totalScore;

    // Create report corroboration record
    const reportRecord = {
      id: memoryStore.nextId('incidentReports'),
      incidentId: canonical.id,
      reporterId: req.user?.id || null,
      reporterName: data.reporterName || req.user?.name || 'Anonymous Citizen',
      reporterPhone: data.reporterPhone || req.user?.phone || null,
      type: data.type,
      severity: data.severity,
      description: data.description,
      locationName: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      clientCreatedAt,
      serverReceivedAt,
    };
    memoryStore.incidentReports.push(reportRecord);

    // Audit log
    memoryStore.auditLogs.push({
      id: memoryStore.nextId('auditLogs'),
      userName: req.user?.name || 'System Corroboration Engine',
      action: 'CORROBORATION_LINK',
      targetType: 'incident',
      targetId: canonical.code,
      details: `Linked report from ${reportRecord.reporterName}. Report count incremented to ${canonical.reportCount}. Priority recalculated to ${canonical.priorityScore.toFixed(2)}. ${dedupResult.matchReasons.join('; ')}`,
      timestamp: serverReceivedAt,
    });

    return res.status(200).json({
      corroborated: true,
      canonicalIncident: canonical,
      report: reportRecord,
      matchDetails: dedupResult,
      message: `Report corroborated existing incident ${canonical.code} (${canonical.title}). Report count incremented and priority score updated.`,
    });
  }

  // NO MATCH -> Create new canonical incident!
  const newId = memoryStore.nextId('incidents');
  const code = generateIncidentCode();
  const title = `${data.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} at ${data.locationName.split(',')[0]}`;

  const pCalc = calculatePriorityScore({
    severity: data.severity,
    createdAt: clientCreatedAt,
    trappedCount: data.trappedCount,
    elderlyChildCount: data.elderlyChildCount,
    medicalEmergency: data.medicalEmergency,
    resourceUrgencyScore: data.resourceUrgencyScore,
    reportCount: 1,
  });

  const newIncident = {
    id: newId,
    code,
    title,
    reporterId: req.user?.id || null,
    type: data.type,
    severity: data.severity,
    description: data.description,
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    status: 'reported',
    reportCount: 1,
    isDuplicateOf: null,
    priorityScore: pCalc.totalScore,
    vulnerabilityScore: pCalc.components.vulnerabilityScore,
    resourceUrgencyScore: pCalc.components.resourceUrgencyScore,
    trappedCount: data.trappedCount,
    elderlyChildCount: data.elderlyChildCount,
    medicalEmergency: data.medicalEmergency,
    assignedVolunteerId: null,
    assignedTeamId: null,
    unitsDeployed: 0,
    icOfficer: 'Unassigned',
    evacuationZone: data.severity === 'critical' ? 'Zone Advisory Active' : 'None',
    estClearTime: 'TBD',
    clientCreatedAt,
    serverReceivedAt,
    updatedAt: serverReceivedAt,
  };
  memoryStore.incidents.push(newIncident);

  // Add initial report record
  const initialReport = {
    id: memoryStore.nextId('incidentReports'),
    incidentId: newIncident.id,
    reporterId: req.user?.id || null,
    reporterName: data.reporterName || req.user?.name || 'Anonymous Citizen',
    reporterPhone: data.reporterPhone || req.user?.phone || null,
    type: data.type,
    severity: data.severity,
    description: data.description,
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    clientCreatedAt,
    serverReceivedAt,
  };
  memoryStore.incidentReports.push(initialReport);

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user?.name || 'Citizen Portal',
    action: 'INCIDENT_CREATED',
    targetType: 'incident',
    targetId: code,
    details: `New ${data.severity.toUpperCase()} incident reported: ${title}. Initial priority score: ${newIncident.priorityScore.toFixed(2)}.`,
    timestamp: serverReceivedAt,
  });

  return res.status(201).json({
    corroborated: false,
    incident: newIncident,
    report: initialReport,
    message: `Incident ${code} successfully reported and assigned priority score ${newIncident.priorityScore.toFixed(2)}.`,
  });
});

// 4. Batch Offline Sync (Resolves conflict using server arrival timestamp)
router.post('/batch-sync', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reports } = req.body;
  if (!Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({ error: 'Array of reports required' });
  }

  const results: any[] = [];
  const serverReceivedAt = new Date();

  // Process in order of server receipt
  for (const item of reports) {
    const parseResult = ReportIncidentSchema.safeParse(item);
    if (!parseResult.success) {
      results.push({ success: false, error: 'Validation failed', item });
      continue;
    }

    const data = parseResult.data;
    const clientCreatedAt = data.clientCreatedAt ? new Date(data.clientCreatedAt) : serverReceivedAt;

    const openIncidents = memoryStore.incidents.filter(
      i => !['resolved', 'contained'].includes(i.status.toLowerCase())
    );

    const dedupResult = checkDuplicate(
      {
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        clientCreatedAt,
        accuracyMeters: data.accuracyMeters,
      },
      openIncidents as any
    );

    if (dedupResult.isDuplicate && dedupResult.canonicalIncident) {
      const canonical = memoryStore.incidents.find(i => i.id === dedupResult.canonicalIncident!.id)!;
      canonical.reportCount += 1;
      canonical.updatedAt = serverReceivedAt;

      const pCalc = calculatePriorityScore({
        severity: canonical.severity,
        createdAt: canonical.clientCreatedAt,
        vulnerabilityScore: canonical.vulnerabilityScore,
        trappedCount: canonical.trappedCount,
        elderlyChildCount: canonical.elderlyChildCount,
        medicalEmergency: canonical.medicalEmergency,
        resourceUrgencyScore: canonical.resourceUrgencyScore,
        reportCount: canonical.reportCount,
      });
      canonical.priorityScore = pCalc.totalScore;

      const rep = {
        id: memoryStore.nextId('incidentReports'),
        incidentId: canonical.id,
        reporterId: req.user?.id || null,
        reporterName: data.reporterName || 'Offline Citizen Sync',
        reporterPhone: data.reporterPhone || null,
        type: data.type,
        severity: data.severity,
        description: data.description,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        clientCreatedAt,
        serverReceivedAt,
      };
      memoryStore.incidentReports.push(rep);

      results.push({
        success: true,
        action: 'corroborated',
        canonicalCode: canonical.code,
        reportId: rep.id,
      });
    } else {
      const newId = memoryStore.nextId('incidents');
      const code = generateIncidentCode();
      const title = `${data.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} at ${data.locationName.split(',')[0]}`;

      const pCalc = calculatePriorityScore({
        severity: data.severity,
        createdAt: clientCreatedAt,
        trappedCount: data.trappedCount,
        elderlyChildCount: data.elderlyChildCount,
        medicalEmergency: data.medicalEmergency,
        resourceUrgencyScore: data.resourceUrgencyScore,
        reportCount: 1,
      });

      const newInc = {
        id: newId,
        code,
        title,
        reporterId: req.user?.id || null,
        type: data.type,
        severity: data.severity,
        description: data.description,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'reported',
        reportCount: 1,
        isDuplicateOf: null,
        priorityScore: pCalc.totalScore,
        vulnerabilityScore: pCalc.components.vulnerabilityScore,
        resourceUrgencyScore: pCalc.components.resourceUrgencyScore,
        trappedCount: data.trappedCount,
        elderlyChildCount: data.elderlyChildCount,
        medicalEmergency: data.medicalEmergency,
        assignedVolunteerId: null,
        assignedTeamId: null,
        unitsDeployed: 0,
        icOfficer: 'Unassigned',
        evacuationZone: 'None',
        estClearTime: 'TBD',
        clientCreatedAt,
        serverReceivedAt,
        updatedAt: serverReceivedAt,
      };
      memoryStore.incidents.push(newInc);

      const rep = {
        id: memoryStore.nextId('incidentReports'),
        incidentId: newInc.id,
        reporterId: req.user?.id || null,
        reporterName: data.reporterName || 'Offline Citizen Sync',
        reporterPhone: data.reporterPhone || null,
        type: data.type,
        severity: data.severity,
        description: data.description,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        clientCreatedAt,
        serverReceivedAt,
      };
      memoryStore.incidentReports.push(rep);

      results.push({
        success: true,
        action: 'created',
        code: newInc.code,
        incidentId: newInc.id,
      });
    }
  }

  res.json({
    syncedCount: results.filter(r => r.success).length,
    totalCount: reports.length,
    details: results,
  });
});

// 5. Get Matching Volunteers for Incident
router.get('/:id/matching-volunteers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const incident = memoryStore.incidents.find(
    i => i.id === Number(id) || i.code.toLowerCase() === String(id).toLowerCase()
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const volunteers = memoryStore.users.filter(u => u.role === 'volunteer');
  const matches = matchVolunteersForIncident(incident, volunteers);

  res.json({
    incident: {
      id: incident.id,
      code: incident.code,
      title: incident.title,
      type: incident.type,
      priorityScore: incident.priorityScore,
    },
    candidates: matches,
  });
});

// 6. Update status / override
router.patch('/:id/status', authenticateToken, requireRole(['authority', 'volunteer']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, icOfficer, unitsDeployed, estClearTime, evacuationZone } = req.body;

  const incident = memoryStore.incidents.find(
    i => i.id === Number(id) || i.code.toLowerCase() === String(id).toLowerCase()
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (status) incident.status = status;
  if (icOfficer !== undefined) incident.icOfficer = icOfficer;
  if (unitsDeployed !== undefined) incident.unitsDeployed = Number(unitsDeployed);
  if (estClearTime !== undefined) incident.estClearTime = estClearTime;
  if (evacuationZone !== undefined) incident.evacuationZone = evacuationZone;
  incident.updatedAt = new Date();

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user?.name || 'Authority',
    action: 'STATUS_OVERRIDE',
    targetType: 'incident',
    targetId: incident.code,
    details: `Updated incident ${incident.code} status to '${status}'. Units: ${incident.unitsDeployed}, Officer: ${incident.icOfficer}`,
    timestamp: new Date(),
  });

  res.json({ success: true, incident });
});

// 7. Assign Volunteer or Team to Incident
router.post('/:id/assign', authenticateToken, requireRole(['authority']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { volunteerId, teamId, unitsCount } = req.body;

  const incident = memoryStore.incidents.find(
    i => i.id === Number(id) || i.code.toLowerCase() === String(id).toLowerCase()
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (volunteerId) {
    const vol = memoryStore.users.find(u => u.id === Number(volunteerId));
    if (vol) {
      incident.assignedVolunteerId = vol.id;
      vol.status = 'deployed';
      incident.status = 'assigned';
    }
  }

  if (teamId) {
    const team = memoryStore.teams.find(t => t.id === Number(teamId));
    if (team) {
      incident.assignedTeamId = team.id;
      team.status = 'deployed';
      team.assignedZone = incident.locationName;
      incident.unitsDeployed = unitsCount || team.memberCount;
      incident.status = 'in_progress';
    }
  }

  incident.updatedAt = new Date();

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user?.name || 'Authority Command',
    action: 'DISPATCH_UNITS',
    targetType: 'incident',
    targetId: incident.code,
    details: `Dispatched ${volunteerId ? `volunteer #${volunteerId}` : ''} ${teamId ? `team #${teamId} (${incident.unitsDeployed} units)` : ''} to ${incident.locationName}`,
    timestamp: new Date(),
  });

  res.json({ success: true, incident });
});

export default router;
