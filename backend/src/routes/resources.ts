import { Router, Response } from 'express';
import { memoryStore } from '../db/index.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get complete resource overview (matching Resources screenshot)
router.get('/overview', (req, res) => {
  // 1. Availability Bars
  const availabilityCategories = [
    {
      id: 'fire_units',
      label: 'Fire Units',
      deployed: 14,
      total: 22,
      color: '#F85149', // Coral Red
    },
    {
      id: 'medical_teams',
      label: 'Medical Teams',
      deployed: 9,
      total: 12,
      color: '#58A6FF', // Cyan Blue
    },
    {
      id: 'search_rescue',
      label: 'Search & Rescue',
      deployed: 4,
      total: 8,
      color: '#D29922', // Amber Gold
    },
    {
      id: 'hazmat',
      label: 'Hazmat',
      deployed: 3,
      total: 4,
      color: '#3FB950', // Emerald Green
    },
    {
      id: 'aerial_support',
      label: 'Aerial Support',
      deployed: 2,
      total: 3,
      color: '#BC8CFF', // Purple
    },
  ];

  // 2. Deployments list
  const deployments = memoryStore.teams.map(t => {
    const inc = t.currentIncidentId ? memoryStore.incidents.find(i => i.id === t.currentIncidentId) : null;
    return {
      id: t.id,
      location: t.assignedZone || 'Metro Dispatch',
      mission: `${t.specialty.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} · ${t.name}`,
      units: t.memberCount,
      status: t.status,
      incidentCode: inc ? inc.code : null,
    };
  });

  // 3. Inventory - Critical Supplies
  const inventory = memoryStore.resourceStock;

  // 4. Resource Centers
  const centers = memoryStore.resourceCenters;

  res.json({
    availabilityCategories,
    deployments,
    inventory,
    centers,
    totalDeployedUnits: availabilityCategories.reduce((sum, c) => sum + c.deployed, 0),
    totalAvailableUnits: availabilityCategories.reduce((sum, c) => sum + c.total, 0),
  });
});

// Update inventory stock levels (Resource Manager)
router.patch('/stock/:id', authenticateToken, requireRole(['resource_manager', 'authority']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, status } = req.body;

  const item = memoryStore.resourceStock.find(s => s.id === Number(id));
  if (!item) {
    return res.status(404).json({ error: 'Stock item not found' });
  }

  if (quantity !== undefined) item.quantity = Number(quantity);
  if (status) item.status = status;

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user!.name,
    action: 'STOCK_UPDATE',
    targetType: 'resource',
    targetId: String(item.id),
    details: `Updated stock of ${item.itemName} to ${item.quantity} ${item.unit}`,
    timestamp: new Date(),
  });

  res.json({ success: true, item });
});

// Allocate stock to an incident/zone
router.post('/allocate', authenticateToken, requireRole(['resource_manager', 'authority']), (req: AuthenticatedRequest, res: Response) => {
  const { stockId, quantity, targetZone, incidentId } = req.body;

  const item = memoryStore.resourceStock.find(s => s.id === Number(stockId));
  if (!item) {
    return res.status(404).json({ error: 'Stock item not found' });
  }

  const qty = Number(quantity);
  if (item.quantity < qty) {
    return res.status(400).json({ error: `Insufficient stock. Only ${item.quantity} available.` });
  }

  item.quantity -= qty;

  // Audit log
  memoryStore.auditLogs.push({
    id: memoryStore.nextId('auditLogs'),
    userName: req.user!.name,
    action: 'STOCK_ALLOCATION',
    targetType: 'resource',
    targetId: String(item.id),
    details: `Allocated ${qty} ${item.unit} of ${item.itemName} to ${targetZone || `Incident #${incidentId}`}`,
    timestamp: new Date(),
  });

  res.json({ success: true, item, remaining: item.quantity });
});

export default router;
