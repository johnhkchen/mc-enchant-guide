// src/content/config.ts
// Astro content collection schemas with Zod validation

import { z, defineCollection } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// Enchantments Collection
// ─────────────────────────────────────────────────────────────

const levelStatSchema = z.object({
  level: z.number().int().positive(),
  effect: z.string(),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
});

const enchantments = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum([
      'damage',
      'protection',
      'utility',
      'weapon',
      'tool',
      'armor',
      'bow',
      'crossbow',
      'trident',
      'mace',
      'curse',
    ]),
    maxLevel: z.number().int().positive(),
    bookMultiplier: z.number().int().positive(),
    itemMultiplier: z.number().int().positive(),
    conflicts: z.array(z.string()).default([]),
    applicableTo: z.array(z.string()),
    icon: z.string().optional(),
    color: z.string().optional(),
    levelStats: z.array(levelStatSchema),
  }),
});

// ─────────────────────────────────────────────────────────────
// Recipes Collection
// ─────────────────────────────────────────────────────────────

const recipes = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'swords',
      'pickaxes',
      'axes',
      'shovels',
      'hoes',
      'helmets',
      'chestplates',
      'leggings',
      'boots',
      'bows',
      'crossbows',
      'tridents',
      'maces',
      'fishing_rods',
      'elytra',
      'shields',
      'shears',
    ]),
    baseItem: z.string(),
    tags: z.array(z.string()).optional(),
    enchantments: z.array(z.record(z.string(), z.number())),
  }),
});

// ─────────────────────────────────────────────────────────────
// Bundles Collection
// ─────────────────────────────────────────────────────────────

const bundles = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    recipes: z.array(z.string()),
    tags: z.array(z.string()).optional(),
  }),
});

// ─────────────────────────────────────────────────────────────
// Export Collections
// ─────────────────────────────────────────────────────────────

export const collections = { enchantments, recipes, bundles };
