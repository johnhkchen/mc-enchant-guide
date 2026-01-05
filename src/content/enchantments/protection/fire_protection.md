---
id: fire_protection
name: "Fire Protection"
category: protection
maxLevel: 4
bookMultiplier: 2
itemMultiplier: 1
conflicts:
  - protection
  - blast_protection
  - projectile_protection
applicableTo:
  - helmet
  - chestplate
  - leggings
  - boots
levelStats:
  - level: 1
    effect: "8% fire damage reduction, -15% burn time"
    numericValue: 8
    unit: "percent"
  - level: 2
    effect: "16% fire damage reduction, -30% burn time"
    numericValue: 16
    unit: "percent"
  - level: 3
    effect: "24% fire damage reduction, -45% burn time"
    numericValue: 24
    unit: "percent"
  - level: 4
    effect: "32% fire damage reduction, -60% burn time"
    numericValue: 32
    unit: "percent"
---

Reduces fire damage and burn time. Useful for Nether exploration and fighting Blazes. Mutually exclusive with other protection enchantments.
