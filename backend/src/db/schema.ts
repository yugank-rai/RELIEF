import { pgTable, text, serial, doublePrecision, integer, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('citizen'), // citizen | volunteer | authority | resource_manager
  skills: text('skills').default('[]'), // JSON array of string tags
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  status: varchar('status', { length: 50 }).default('available'), // available | deployed | busy | offline
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 30 }).unique().notNull(), // e.g. INC-0841
  title: varchar('title', { length: 255 }).notNull(),
  reporterId: integer('reporter_id').references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(), // flood | wildfire | structure_fire | gas_leak | landslide | road_collapse | chemical_spill | medical | civil_unrest | other
  severity: varchar('severity', { length: 50 }).notNull(), // low | moderate | high | critical
  description: text('description').notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('reported'), // reported | verified | assigned | in_progress | contained | resolved
  reportCount: integer('report_count').notNull().default(1),
  isDuplicateOf: integer('is_duplicate_of'),
  priorityScore: doublePrecision('priority_score').notNull().default(0.0),
  vulnerabilityScore: doublePrecision('vulnerability_score').notNull().default(5.0),
  resourceUrgencyScore: doublePrecision('resource_urgency_score').notNull().default(5.0),
  trappedCount: integer('trapped_count').default(0),
  elderlyChildCount: integer('elderly_child_count').default(0),
  medicalEmergency: boolean('medical_emergency').default(false),
  assignedVolunteerId: integer('assigned_volunteer_id').references(() => users.id),
  assignedTeamId: integer('assigned_team_id'),
  unitsDeployed: integer('units_deployed').default(0),
  icOfficer: varchar('ic_officer', { length: 100 }).default('Unassigned'),
  evacuationZone: varchar('evacuation_zone', { length: 50 }),
  estClearTime: varchar('est_clear_time', { length: 50 }),
  clientCreatedAt: timestamp('client_created_at').notNull().defaultNow(),
  serverReceivedAt: timestamp('server_received_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const incidentReports = pgTable('incident_reports', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').references(() => incidents.id).notNull(),
  reporterId: integer('reporter_id').references(() => users.id),
  reporterName: varchar('reporter_name', { length: 255 }).default('Anonymous Citizen'),
  reporterPhone: varchar('reporter_phone', { length: 50 }),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  description: text('description').notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  clientCreatedAt: timestamp('client_created_at').notNull().defaultNow(),
  serverReceivedAt: timestamp('server_received_at').notNull().defaultNow(),
});

export const resourceCenters = pgTable('resource_centers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  managerId: integer('manager_id').references(() => users.id),
  contactPhone: varchar('contact_phone', { length: 50 }),
  zone: varchar('zone', { length: 50 }),
});

export const resourceStock = pgTable('resource_stock', {
  id: serial('id').primaryKey(),
  centerId: integer('center_id').references(() => resourceCenters.id).notNull(),
  itemType: varchar('item_type', { length: 100 }).notNull(), // medical_kit | water_boat | generator | water_purifier | food_ration | blanket | hazmat_suit
  itemName: varchar('item_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // fire | medical | rescue | hazmat | life_support
  quantity: integer('quantity').notNull().default(0),
  maxCapacity: integer('max_capacity').notNull().default(100),
  unit: varchar('unit', { length: 50 }).notNull().default('units'),
  status: varchar('status', { length: 50 }).default('in_stock'),
});

export const shelters = pgTable('shelters', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  capacity: integer('capacity').notNull().default(100),
  occupancy: integer('occupancy').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  hasMedical: boolean('has_medical').notNull().default(true),
  hasFood: boolean('has_food').notNull().default(true),
  hasPower: boolean('has_power').notNull().default(true),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g. Alpha Team, Bravo Team
  captain: varchar('captain', { length: 255 }).notNull(),
  specialty: varchar('specialty', { length: 100 }).notNull(), // flood_response | wildfire_suppression | hazmat | search_rescue
  memberCount: integer('member_count').notNull().default(6),
  status: varchar('status', { length: 50 }).notNull().default('standby'), // deployed | standby | en_route
  assignedZone: varchar('assigned_zone', { length: 100 }),
  currentIncidentId: integer('current_incident_id').references(() => incidents.id),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('userId'),
  userName: varchar('user_name', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(), // DISPATCH_UNITS | STATUS_CHANGE | CORROBORATION_LINK | STOCK_ALLOCATION
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: varchar('target_id', { length: 100 }),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});
