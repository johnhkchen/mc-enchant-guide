---
id: blast_protection
name: "Blast Protection"
category: protection
maxLevel: 4
bookMultiplier: 4
itemMultiplier: 2
conflicts:
  - protection
  - fire_protection
  - projectile_protection
applicableTo:
  - helmet
  - chestplate
  - leggings
  - boots
levelStats:
  - level: 1
    effect: "8% explosion damage reduction, -15% knockback"
    numericValue: 8
    unit: "percent"
  - level: 2
    effect: "16% explosion damage reduction, -30% knockback"
    numericValue: 16
    unit: "percent"
  - level: 3
    effect: "24% explosion damage reduction, -45% knockback"
    numericValue: 24
    unit: "percent"
  - level: 4
    effect: "32% explosion damage reduction, -60% knockback"
    numericValue: 32
    unit: "percent"
---

Reduces explosion damage and knockback from explosions. Useful for fighting Creepers, Ghasts, and the Wither. Mutually exclusive with other protection enchantments.
