---
id: projectile_protection
name: "Projectile Protection"
category: protection
maxLevel: 4
bookMultiplier: 2
itemMultiplier: 1
conflicts:
  - protection
  - fire_protection
  - blast_protection
applicableTo:
  - helmet
  - chestplate
  - leggings
  - boots
levelStats:
  - level: 1
    effect: "8% projectile damage reduction"
    numericValue: 8
    unit: "percent"
  - level: 2
    effect: "16% projectile damage reduction"
    numericValue: 16
    unit: "percent"
  - level: 3
    effect: "24% projectile damage reduction"
    numericValue: 24
    unit: "percent"
  - level: 4
    effect: "32% projectile damage reduction"
    numericValue: 32
    unit: "percent"
---

Reduces damage from projectiles (arrows, tridents, Ghast fireballs, Blaze fireballs). Useful for fighting Skeletons and ranged mobs. Mutually exclusive with other protection enchantments.
