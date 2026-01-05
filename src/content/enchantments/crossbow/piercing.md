---
id: piercing
name: "Piercing"
category: crossbow
maxLevel: 4
bookMultiplier: 1
itemMultiplier: 1
conflicts:
  - multishot
applicableTo:
  - crossbow
levelStats:
  - level: 1
    effect: "Arrow pierces 1 mob"
    numericValue: 1
    unit: "mobs"
  - level: 2
    effect: "Arrow pierces 2 mobs"
    numericValue: 2
    unit: "mobs"
  - level: 3
    effect: "Arrow pierces 3 mobs"
    numericValue: 3
    unit: "mobs"
  - level: 4
    effect: "Arrow pierces 4 mobs"
    numericValue: 4
    unit: "mobs"
---

Arrows pass through entities without stopping, hitting multiple targets in a line. Also allows arrows to pass through shields. Mutually exclusive with Multishot.
