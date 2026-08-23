import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { memoryStore } from '../db/index.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6),
  role: z.enum(['citizen', 'volunteer', 'authority', 'resource_manager']).default('citizen'),
  skills: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.issues });
  }

  const { email, password } = result.data;
  const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      skills: typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills,
      latitude: user.latitude,
      longitude: user.longitude,
      status: user.status,
    },
  });
});

// Quick-login for demo role switching
router.post('/quick-login', (req: Request, res: Response) => {
  const role = (req.body.role || 'authority').toLowerCase();
  const user = memoryStore.users.find(u => u.role === role) || memoryStore.users[0];

  if (!user) {
    return res.status(404).json({ error: `No demo user found for role ${role}` });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      skills: typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills,
      latitude: user.latitude,
      longitude: user.longitude,
      status: user.status,
    },
  });
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.issues });
  }

  const data = result.data;
  const existing = memoryStore.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const newUser = {
    id: memoryStore.nextId('users'),
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: data.role,
    skills: JSON.stringify(data.skills || []),
    latitude: data.latitude || 34.0522,
    longitude: data.longitude || -118.2437,
    status: 'available',
    createdAt: new Date(),
  };

  memoryStore.users.push(newUser);
  const token = generateToken(newUser);

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      skills: data.skills || [],
      latitude: newUser.latitude,
      longitude: newUser.longitude,
      status: newUser.status,
    },
  });
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = memoryStore.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      skills: typeof user.skills === 'string' ? JSON.parse(user.skills || '[]') : user.skills,
      latitude: user.latitude,
      longitude: user.longitude,
      status: user.status,
    },
  });
});

export default router;
