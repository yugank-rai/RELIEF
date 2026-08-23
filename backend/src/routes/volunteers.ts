import { Router, Response } from 'express';
import { memoryStore } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// List volunteers with optional status filter
router.get('/', (req, res) => {
  const { status, skill } = req.query;
  let volunteers = memoryStore.users.filter(u => u.role === 'volunteer');

  if (status && typeof status === 'string') {
    volunteers = volunteers.filter(v => v.status === status);
  }

  const result = volunteers.map(v => ({
    id: v.id,
    name: v.name,
    email: v.email,
    phone: v.phone,
    skills: typeof v.skills === 'string' ? JSON.parse(v.skills || '[]') : v.skills,
    latitude: v.latitude,
    longitude: v.longitude,
    status: v.status,
    createdAt: v.createdAt,
  }));

  res.json(result);
});

// Volunteer gets their assigned tasks
router.get('/my-tasks', authenticateToken, requireRole(['volunteer', 'authority']), (req: AuthenticatedRequest, res: Response) => {
  const volunteerId = req.user!.id;
  const assignedIncidents = memoryStore.incidents.filter(
    i => i.assignedVolunteerId === volunteerId || i.status === 'reported' || i.status === 'in_progress'
  );

  res.json({
    assigned: memoryStore.incidents.filter(i => i.assignedVolunteerId === volunteerId),
    nearbyOpen: memoryStore.incidents.filter(i => !['resolved', 'contained'].includes(i.status)),
  });
});

// Volunteer accepts a task
router.post('/accept-task/:incidentId', authenticateToken, requireRole(['volunteer']), (req: AuthenticatedRequest, res: Response) => {
  const { incidentId } = req.params;
  const incident = memoryStore.incidents.find(
    i => i.id === Number(incidentId) || i.code === incidentId
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const volunteer = memoryStore.users.find(u => u.id === req.user!.id);
  if (volunteer) {
    volunteer.status = 'deployed';
  }

  incident.assignedVolunteerId = req.user!.id;
  incident.status = 'in_progress';
  incident.unitsDeployed = (incident.unitsDeployed || 0) + 1;
  incident.updatedAt = new Date();

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user!.name,
    action: 'TASK_ACCEPTED',
    targetType: 'incident',
    targetId: incident.code,
    details: `Volunteer ${req.user!.name} accepted task for incident ${incident.code}`,
    timestamp: new Date(),
  });

  res.json({ success: true, incident, message: `Task for ${incident.code} accepted.` });
});

// Volunteer updates their status (available, busy, offline)
router.patch('/status', authenticateToken, requireRole(['volunteer']), (req: AuthenticatedRequest, res: Response) => {
  const { status, latitude, longitude } = req.body;
  const volunteer = memoryStore.users.find(u => u.id === req.user!.id);

  if (!volunteer) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }

  if (status) volunteer.status = status;
  if (latitude !== undefined) volunteer.latitude = latitude;
  if (longitude !== undefined) volunteer.longitude = longitude;

  res.json({ success: true, volunteer });
});

export default router;
