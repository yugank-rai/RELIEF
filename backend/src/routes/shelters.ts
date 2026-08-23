import { Router, Response } from 'express';
import { memoryStore } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { calculateHaversineDistance } from '../services/dedupService.js';

const router = Router();

// List all shelters with optional sorting by proximity
router.get('/', (req, res) => {
  const { lat, lon } = req.query;

  let shelters = memoryStore.shelters.map(s => {
    const occupancyPercent = Math.round((s.occupancy / s.capacity) * 100);
    const availableBeds = Math.max(0, s.capacity - s.occupancy);
    let distanceKm: number | null = null;

    if (lat && lon) {
      const distMeters = calculateHaversineDistance(
        { latitude: Number(lat), longitude: Number(lon) },
        { latitude: s.latitude, longitude: s.longitude }
      );
      distanceKm = Math.round((distMeters / 1000) * 10) / 10;
    }

    return {
      ...s,
      occupancyPercent,
      availableBeds,
      distanceKm,
      isFull: s.occupancy >= s.capacity,
    };
  });

  if (lat && lon) {
    shelters.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }

  res.json(shelters);
});

// Update shelter occupancy / status
router.patch('/:id', authenticateToken, requireRole(['authority', 'resource_manager']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { occupancy, capacity, isActive, hasMedical, hasFood, hasPower } = req.body;

  const shelter = memoryStore.shelters.find(s => s.id === Number(id));
  if (!shelter) {
    return res.status(404).json({ error: 'Shelter not found' });
  }

  if (occupancy !== undefined) shelter.occupancy = Number(occupancy);
  if (capacity !== undefined) shelter.capacity = Number(capacity);
  if (isActive !== undefined) shelter.isActive = Boolean(isActive);
  if (hasMedical !== undefined) shelter.hasMedical = Boolean(hasMedical);
  if (hasFood !== undefined) shelter.hasFood = Boolean(hasFood);
  if (hasPower !== undefined) shelter.hasPower = Boolean(hasPower);

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user!.name,
    action: 'SHELTER_UPDATE',
    targetType: 'shelter',
    targetId: String(shelter.id),
    details: `Updated shelter ${shelter.name}: Occupancy ${shelter.occupancy}/${shelter.capacity} (${shelter.isActive ? 'Active' : 'Inactive'})`,
    timestamp: new Date(),
  });

  res.json({ success: true, shelter });
});

export default router;
