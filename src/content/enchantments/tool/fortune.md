---
id: fortune
name: "Fortune"
category: tool
maxLevel: 3
bookMultiplier: 2
itemMultiplier: 4
conflicts:
  - silk_touch
applicableTo:
  - pickaxe
  - axe
  - shovel
  - hoe
levelStats:
  - level: 1
    effect: "33% chance for 2x drops (avg +33%)"
    numericValue: 33
    unit: "percent increase"
  - level: 2
    effect: "25% each for 2x or 3x drops (avg +75%)"
    numericValue: 75
    unit: "percent increase"
  - level: 3
    effect: "20% each for 2x, 3x, or 4x drops (avg +120%)"
    numericValue: 120
    unit: "percent increase"
---

Increases the drop rates from mining ores and certain blocks. Essential for diamond mining and resource gathering. Mutually exclusive with Silk Touch.
