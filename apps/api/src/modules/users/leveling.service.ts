import { Injectable } from '@nestjs/common';

/**
 * XP and Level calculation service
 * Level thresholds follow a progressive curve
 */

// XP required per level (cumulative from level 1)
const LEVEL_XP_TABLE: number[] = [
  0,      // Level 1: starts at 0 XP
  100,    // Level 2: need 100 XP
  250,    // Level 3: need 250 XP
  500,    // Level 4: need 500 XP
  900,    // Level 5: need 900 XP
  1400,   // Level 6
  2100,   // Level 7
  3000,   // Level 8
  4200,   // Level 9
  5700,   // Level 10
  7500,   // Level 11
  9800,   // Level 12
  12500,  // Level 13
  15800,  // Level 14
  19800,  // Level 15
  24600,  // Level 16
  30400,  // Level 17
  37200,  // Level 18
  45200,  // Level 19
  54600,  // Level 20
];

const MAX_LEVEL = 20;

@Injectable()
export class LevelingService {
  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): number {
    let level = 1;
    for (let i = LEVEL_XP_TABLE.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_XP_TABLE[i]) {
        level = i + 1;
        break;
      }
    }
    return Math.min(level, MAX_LEVEL);
  }

  /**
   * Get XP required to reach next level
   */
  getXpToNextLevel(currentXp: number): number {
    const currentLevel = this.calculateLevel(currentXp);
    if (currentLevel >= MAX_LEVEL) return 0;

    const nextLevelXp = LEVEL_XP_TABLE[currentLevel]; // index = level (0-based, level 1 = index 0)
    return Math.max(0, nextLevelXp - currentXp);
  }

  /**
   * Get XP required for a specific level
   */
  getXpForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) return LEVEL_XP_TABLE[MAX_LEVEL - 1];
    return LEVEL_XP_TABLE[level - 1];
  }

  /**
   * Check if user leveled up after XP gain
   */
  checkLevelUp(oldXp: number, newXp: number): { leveledUp: boolean; oldLevel: number; newLevel: number } {
    const oldLevel = this.calculateLevel(oldXp);
    const newLevel = this.calculateLevel(newXp);
    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
    };
  }

  /**
   * Get progress within current level (0-100%)
   */
  getLevelProgress(xp: number): number {
    const level = this.calculateLevel(xp);
    if (level >= MAX_LEVEL) return 100;

    const currentLevelXp = this.getXpForLevel(level);
    const nextLevelXp = this.getXpForLevel(level + 1);
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  }
}
