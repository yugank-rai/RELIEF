import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { memoryStore } from '../db/index.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Master Authority Access Passcode for emergency official registration
const AUTHORITY_ACCESS_PASSCODE = 'COMMAND-2026';

// 1. Zod Validation Schemas
const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  expectedPortal: z.enum(['authority', 'public']).optional(),
});

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(5, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['citizen', 'volunteer', 'authority', 'resource_manager']).default('citizen'),
  authorityPasscode: z.string().optional(),
  skills: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const GoogleAuthSchema = z.object({
  email: z.string().email('Invalid email from Google account'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['citizen', 'volunteer', 'authority', 'resource_manager']).default('citizen'),
  authorityPasscode: z.string().optional(),
  googleId: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

// 2. Standard Email/Password Login
router.post('/login', async (req: Request, res: Response) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', details: result.error.issues });
  }

  const { email, password, expectedPortal } = result.data;
  const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Enforce portal separation
  if (expectedPortal === 'authority' && user.role !== 'authority' && user.role !== 'resource_manager') {
    return res.status(403).json({ 
      error: 'Access Denied: This account does not possess Command Authority privileges. Please use the Citizen & Volunteer Portal.' 
    });
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

// 3. Google / Gmail Sign-In & Registration
router.post('/google', async (req: Request, res: Response) => {
  const result = GoogleAuthSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid Google auth payload', details: result.error.issues });
  }

  const { email, name, role, authorityPasscode, skills } = result.data;
  let user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // If registering as authority, enforce passcode
  if (!user && (role === 'authority' || role === 'resource_manager')) {
    if (!authorityPasscode || authorityPasscode.trim() !== AUTHORITY_ACCESS_PASSCODE) {
      return res.status(403).json({ 
        error: 'Invalid Authority Passcode. Authorized command credentials required for this role.' 
      });
    }
  }

  // Create user if doesn't exist
  if (!user) {
    const dummyHash = await bcrypt.hash(`google-auth-${Date.now()}`, 10);
    user = {
      id: memoryStore.nextId('users'),
      name,
      email,
      phone: '+1 (555) 019-2831',
      passwordHash: dummyHash,
      role,
      skills: JSON.stringify(skills || []),
      latitude: 34.0522,
      longitude: -118.2437,
      status: 'available',
      createdAt: new Date(),
    };
    memoryStore.users.push(user);
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

// 4. Quick-login for demo role switching (Guarded)
router.post('/quick-login', (req: Request, res: Response) => {
  const role = (req.body.role || 'citizen').toLowerCase();
  const { authorityPasscode } = req.body;

  // STRICT ENFORCEMENT: Escalating to authority or resource_manager requires the verified authority passcode
  if (role === 'authority' || role === 'resource_manager') {
    if (!authorityPasscode || authorityPasscode.trim() !== AUTHORITY_ACCESS_PASSCODE) {
      return res.status(403).json({ 
        error: 'Access Denied: Elevating to Authority Command requires official security passcode (COMMAND-2026).' 
      });
    }
  }

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

// 5. Account Registration
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

  // Verify passcode if attempting to register as Authority or Resource Manager
  if (data.role === 'authority' || data.role === 'resource_manager') {
    if (!data.authorityPasscode || data.authorityPasscode.trim() !== AUTHORITY_ACCESS_PASSCODE) {
      return res.status(403).json({ 
        error: `Access Denied: Invalid Command Passcode. Enter '${AUTHORITY_ACCESS_PASSCODE}' for authority clearance.` 
      });
    }
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

// 6. Get Current User Profile (JWT Protected)
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
