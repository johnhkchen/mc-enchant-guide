# Reference Documentation

This document contains authoritative sources for Minecraft enchanting mechanics.
**All enchantment data in this project MUST be verified against these sources.**

---

## Primary Sources (Authoritative)

### Minecraft Wiki

The official community wiki is the authoritative source for game mechanics.

| Topic | URL |
|-------|-----|
| **Anvil Mechanics** | https://minecraft.wiki/w/Anvil_mechanics |
| **Enchanting Overview** | https://minecraft.wiki/w/Enchanting |
| **Experience/XP System** | https://minecraft.wiki/w/Experience |
| **Enchantment Definitions** | https://minecraft.wiki/w/Enchantment_definition |
| **All Enchantments List** | https://minecraft.wiki/w/Category:Enchantments |
| **XP Calculator** | https://minecraft.wiki/w/Calculators/Required_experience |

### Individual Enchantment Pages

Each enchantment has a dedicated wiki page with exact stats:

- https://minecraft.wiki/w/Sharpness
- https://minecraft.wiki/w/Smite
- https://minecraft.wiki/w/Mending
- https://minecraft.wiki/w/Unbreaking
- https://minecraft.wiki/w/Density
- https://minecraft.wiki/w/Breach
- https://minecraft.wiki/w/Wind_Burst

Pattern: `https://minecraft.wiki/w/{Enchantment_Name}`

---

## Data Sources (Machine-Readable)

### PrismarineJS/minecraft-data

Community-maintained, version-specific game data in JSON format.

| Resource | URL |
|----------|-----|
| **Repository** | https://github.com/PrismarineJS/minecraft-data |
| **Enchantments (1.21)** | https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.21/enchantments.json |
| **Enchantments (1.20)** | https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/1.20/enchantments.json |
| **Documentation** | https://prismarinejs.github.io/minecraft-data/ |

**Note**: Data is extracted from wiki.vg and the Minecraft Wiki. Always cross-reference with primary sources.

### Misode's Data Pack Generators

Interactive tools for Minecraft data, useful for verifying JSON structures:

- https://misode.github.io/
- https://misode.github.io/generators/

---

## Core Formulas

### Experience (XP) to Level

Source: https://minecraft.wiki/w/Experience

```
For levels 0-16:
  Total XP = level² + 6 × level

For levels 17-31:
  Total XP = 2.5 × level² - 40.5 × level + 360

For levels 32+:
  Total XP = 4.5 × level² - 162.5 × level + 2220
```

**Reference Values** (verify implementation against these):

| Level | Total XP Required |
|-------|-------------------|
| 0     | 0                 |
| 1     | 7                 |
| 7     | 91                |
| 15    | 315               |
| 16    | 352               |
| 17    | 394               |
| 30    | 1,395             |
| 31    | 1,507             |
| 32    | 1,628             |
| 39    | 2,727             |
| 40    | 2,920             |
| 50    | 5,345             |

### Prior Work Penalty (PWP)

Source: https://minecraft.wiki/w/Anvil_mechanics

```
Penalty = 2^n - 1

Where n = number of prior anvil operations on the item
```

| Operations (n) | Penalty Added |
|----------------|---------------|
| 0              | 0             |
| 1              | 1             |
| 2              | 3             |
| 3              | 7             |
| 4              | 15            |
| 5              | 31            |
| 6              | 63 (Too Expensive in Survival) |

### Anvil Cost Calculation

Source: https://minecraft.wiki/w/Anvil_mechanics

```
Total Cost = Target PWP + Sacrifice PWP + Enchantment Cost + Rename Cost (if any)

Enchantment Cost = Σ (enchantment_level × multiplier)
  - Use "Multiplier from Book" when sacrifice is a book
  - Use "Multiplier from Item" when sacrifice is an item

Survival Mode Cap: 39 levels maximum
```

---

## Enchantment Multiplier Table

Source: https://minecraft.wiki/w/Anvil_mechanics

| Enchantment | Max Level | Book Mult | Item Mult |
|-------------|-----------|-----------|-----------|
| **Damage Enchantments** |
| Sharpness | 5 | 1 | 1 |
| Smite | 5 | 1 | 2 |
| Bane of Arthropods | 5 | 1 | 2 |
| Density | 5 | 1 | 2 |
| Breach | 4 | 2 | 4 |
| Impaling | 5 | 2 (Java) / 1 (Bedrock) | 4 (Java) / 2 (Bedrock) |
| Power | 5 | 1 | 1 |
| **Protection Enchantments** |
| Protection | 4 | 1 | 1 |
| Fire Protection | 4 | 2 | 1 |
| Blast Protection | 4 | 4 | 2 |
| Projectile Protection | 4 | 2 | 1 |
| Feather Falling | 4 | 1 | 2 |
| **Weapon Utility** |
| Knockback | 2 | 1 | 2 |
| Fire Aspect | 2 | 2 | 4 |
| Looting | 3 | 2 | 4 |
| Sweeping Edge | 3 | 2 | 4 |
| **Tool Enchantments** |
| Efficiency | 5 | 1 | 1 |
| Silk Touch | 1 | 4 | 8 |
| Fortune | 3 | 2 | 4 |
| **Durability** |
| Unbreaking | 3 | 1 | 2 |
| Mending | 1 | 2 | 4 |
| **Bow Enchantments** |
| Punch | 2 | 2 | 4 |
| Flame | 1 | 2 | 4 |
| Infinity | 1 | 4 | 8 |
| **Crossbow Enchantments** |
| Multishot | 1 | 2 | 4 |
| Piercing | 4 | 1 | 1 |
| Quick Charge | 3 | 1 | 2 |
| **Trident Enchantments** |
| Loyalty | 3 | 1 | 1 |
| Riptide | 3 | 2 | 4 |
| Channeling | 1 | 4 | 8 |
| **Mace Enchantments (1.21+)** |
| Density | 5 | 1 | 2 |
| Breach | 4 | 2 | 4 |
| Wind Burst | 3 | 2 | 4 |
| **Armor Utility** |
| Thorns | 3 | 4 | 8 |
| Respiration | 3 | 2 | 4 |
| Aqua Affinity | 1 | 2 | 4 |
| Depth Strider | 3 | 2 | 4 |
| Frost Walker | 2 | 2 | 4 |
| Soul Speed | 3 | 4 | 8 |
| Swift Sneak | 3 | 4 | 8 |
| **Fishing Rod** |
| Luck of the Sea | 3 | 2 | 4 |
| Lure | 3 | 2 | 4 |
| **Curses** |
| Curse of Binding | 1 | 4 | 8 |
| Curse of Vanishing | 1 | 4 | 8 |

---

## Enchantment Conflicts

Source: https://minecraft.wiki/w/Enchanting (Incompatibilities section)

### Mutually Exclusive Groups

```yaml
damage_exclusive:
  - sharpness
  - smite
  - bane_of_arthropods
  # Also on mace: density, breach

protection_exclusive:
  - protection
  - fire_protection
  - blast_protection
  - projectile_protection

silk_fortune:
  - silk_touch
  - fortune

depth_frost:
  - depth_strider
  - frost_walker

riptide_exclusive:
  - riptide
  - loyalty      # Only conflicts on trident
  - channeling   # Only conflicts on trident

infinity_mending:
  - infinity
  - mending      # Only conflicts on bow

multishot_piercing:
  - multishot
  - piercing
```

### Item-Specific Conflicts

| Conflict | Item Type | Notes |
|----------|-----------|-------|
| Mending + Infinity | Bow only | Can coexist on other items via commands |
| Riptide + Loyalty | Trident only | Functional conflict |
| Riptide + Channeling | Trident only | Functional conflict |

---

## Version-Specific Changes

### 1.21 (Tricky Trials)

Source: https://minecraft.wiki/w/Java_Edition_1.21

- Added **Mace** weapon
- Added **Density** enchantment (mace-exclusive)
- Added **Breach** enchantment (mace-exclusive)
- Added **Wind Burst** enchantment (mace-exclusive)

### 1.20 (Trails & Tales)

- No enchanting changes

### 1.19 (The Wild Update)

- Added **Swift Sneak** enchantment (leggings only)

### 1.16 (Nether Update)

- Added **Soul Speed** enchantment (boots only, treasure)

---

## External Tools (For Verification)

| Tool | URL | Purpose |
|------|-----|---------|
| iamcal's Enchant Order | https://iamcal.github.io/enchant-order/ | Reference implementation |
| Source Code | https://github.com/iamcal/enchant-order | Algorithm reference |

---

## Data Validation Checklist

When adding or modifying enchantment data, verify:

- [ ] Max level matches wiki
- [ ] Book multiplier matches wiki anvil mechanics table
- [ ] Item multiplier matches wiki anvil mechanics table
- [ ] Conflicts list is complete
- [ ] Applicable items list is accurate
- [ ] Level stats (damage values, percentages) match individual enchantment wiki pages
- [ ] Any version-specific behavior is noted

---

## Contributing Data

1. **Always cite your source** - Include wiki URL in PR description
2. **Cross-reference** - Check at least 2 sources for new data
3. **Test edge cases** - Verify in-game if possible
4. **Document version** - Note which Minecraft version the data applies to

---

## Last Verified

| Data Type | Verified Against | Date | Minecraft Version |
|-----------|------------------|------|-------------------|
| XP Formulas | minecraft.wiki/w/Experience | TBD | 1.21 |
| Multipliers | minecraft.wiki/w/Anvil_mechanics | TBD | 1.21 |
| Conflicts | minecraft.wiki/w/Enchanting | TBD | 1.21 |
| Mace Enchants | minecraft.wiki/w/Mace | TBD | 1.21 |
