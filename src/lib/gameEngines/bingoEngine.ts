/**
 * Bingo Game Engine
 * Separates game logic from React component
 */

export type BingoPattern = {
  name: string;
  check: (marked: boolean[][]) => boolean;
};

/**
 * Bingo patterns for 5x5 card
 */
export const BINGO_PATTERNS: BingoPattern[] = [
  {
    name: "Five in a Row",
    check: (marked) => {
      // Check all rows
      for (let r = 0; r < 5; r++) {
        let count = 0;
        for (let c = 0; c < 5; c++) {
          if (marked[r][c]) count++;
        }
        if (count === 5) return true;
      }
      return false;
    }
  },
  {
    name: "Five in a Column",
    check: (marked) => {
      // Check all columns
      for (let c = 0; c < 5; c++) {
        let count = 0;
        for (let r = 0; r < 5; r++) {
          if (marked[r][c]) count++;
        }
        if (count === 5) return true;
      }
      return false;
    }
  },
  {
    name: "Diagonal (↘)",
    check: (marked) => {
      let count = 0;
      for (let i = 0; i < 5; i++) {
        if (marked[i][i]) count++;
      }
      return count === 5;
    }
  },
  {
    name: "Diagonal (↙)",
    check: (marked) => {
      let count = 0;
      for (let i = 0; i < 5; i++) {
        if (marked[i][4 - i]) count++;
      }
      return count === 5;
    }
  }
];

/**
 * Generate random bingo numbers 1-75
 */
export const generateBingoNumbers = (): number[] => {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
};

/**
 * Get bingo column for a number
 * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 */
export const getNumberColumn = (num: number): string => {
  if (num <= 15) return "B";
  if (num <= 30) return "I";
  if (num <= 45) return "N";
  if (num <= 60) return "G";
  return "O";
};

/**
 * Check if pattern is won
 */
export const checkPattern = (pattern: BingoPattern, marked: boolean[][]): boolean => {
  return pattern.check(marked);
};
