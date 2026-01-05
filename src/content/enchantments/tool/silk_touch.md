---
id: silk_touch
name: "Silk Touch"
category: tool
maxLevel: 1
bookMultiplier: 4
itemMultiplier: 8
conflicts:
  - fortune
applicableTo:
  - pickaxe
  - axe
  - shovel
  - hoe
levelStats:
  - level: 1
    effect: "Drops block itself instead of normal drops"
    numericValue: 1
    unit: "block"
---

Causes mined blocks to drop themselves instead of their usual drops. Stone drops stone (not cobblestone), ores drop ore blocks, grass blocks drop grass blocks, etc. Mutually exclusive with Fortune.
