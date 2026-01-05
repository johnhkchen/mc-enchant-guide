---
id: loyalty
name: "Loyalty"
category: trident
maxLevel: 3
bookMultiplier: 1
itemMultiplier: 1
conflicts:
  - riptide
applicableTo:
  - trident
levelStats:
  - level: 1
    effect: "Slow return speed"
    numericValue: 1
    unit: "speed"
  - level: 2
    effect: "Medium return speed"
    numericValue: 2
    unit: "speed"
  - level: 3
    effect: "Fast return speed"
    numericValue: 3
    unit: "speed"
---

Causes the trident to return after being thrown. Higher levels return faster. Does not return if player dies or trident falls into void. Mutually exclusive with Riptide.
