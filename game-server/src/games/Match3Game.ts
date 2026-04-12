/**
 * Match-3 Game Engine (Candy Crush style)
 * 8×8 grid, cascade logic, scoring
 */

export type CandyType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Match3State {
  grid: (CandyType | null)[][];
  score: number;
  moves: number;
  isAnimating: boolean;
  selectedTile: [number, number] | null;
}

const GRID_SIZE = 8;
const CANDY_TYPES: CandyType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

/**
 * Initialize a new Match-3 game state
 */
export const initializeGame = (): Match3State => {
  return {
    grid: generateInitialGrid(),
    score: 0,
    moves: 30, // Players get 30 moves
    isAnimating: false,
    selectedTile: null
  };
};

/**
 * Generate random grid avoiding initial matches
 */
const generateInitialGrid = (): (CandyType | null)[][] => {
  const grid: (CandyType | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      let candy: CandyType;
      do {
        candy = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
      } while (
        // Avoid matches on generation
        (col >= 2 && grid[row][col - 1] === candy && grid[row][col - 2] === candy) ||
        (row >= 2 && grid[row - 1][col] === candy && grid[row - 2][col] === candy)
      );
      grid[row][col] = candy;
    }
  }

  return grid;
};

/**
 * Handle tile selection and swap
 */
export const selectTile = (
  state: Match3State,
  row: number,
  col: number
): Match3State => {
  if (state.isAnimating || state.moves <= 0) return state;

  // Adjacent tile swap
  if (state.selectedTile) {
    const [prevRow, prevCol] = state.selectedTile;
    const distance = Math.abs(row - prevRow) + Math.abs(col - prevCol);

    if (distance === 1) {
      // Valid adjacent swap
      const newState = { ...state };
      [newState.grid[prevRow][prevCol], newState.grid[row][col]] = [
        newState.grid[row][col],
        newState.grid[prevRow][prevCol]
      ];

      newState.moves -= 1;
      newState.selectedTile = null;
      newState.isAnimating = true;

      // Check for matches after swap
      setTimeout(() => {
        processMatches(newState);
      }, 300); // Animation delay

      return newState;
    }
  }

  return { ...state, selectedTile: [row, col] };
};

/**
 * Detect and clear matches
 */
const processMatches = (state: Match3State): void => {
  const matches = findMatches(state.grid);

  if (matches.length === 0) {
    state.isAnimating = false;
    return;
  }

  // Clear matched candies
  matches.forEach(([row, col]) => {
    state.grid[row][col] = null;
  });

  // Add score (3 matches = 10 points, 4+ matches = 25 points)
  if (matches.length === 3) state.score += 10;
  else if (matches.length >= 4) state.score += 25;

  // Cascade candies down
  cascadeGrid(state.grid);

  // Recursively check for more matches (cascading)
  setTimeout(() => {
    processMatches(state);
  }, 300);
};

/**
 * Find all matching sets of 3+ candies
 */
const findMatches = (grid: (CandyType | null)[][]): [number, number][] => {
  const matches = new Set<string>();

  // Check horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 2; col++) {
      const candy = grid[row][col];
      if (
        candy &&
        candy === grid[row][col + 1] &&
        candy === grid[row][col + 2]
      ) {
        matches.add(`${row},${col}`);
        matches.add(`${row},${col + 1}`);
        matches.add(`${row},${col + 2}`);
      }
    }
  }

  // Check vertical matches
  for (let row = 0; row < GRID_SIZE - 2; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const candy = grid[row][col];
      if (
        candy &&
        candy === grid[row + 1][col] &&
        candy === grid[row + 2][col]
      ) {
        matches.add(`${row},${col}`);
        matches.add(`${row + 1},${col}`);
        matches.add(`${row + 2},${col}`);
      }
    }
  }

  return Array.from(matches).map(str => {
    const [r, c] = str.split(',').map(Number);
    return [r, c];
  });
};

/**
 * Drop candies down to fill empty spaces
 */
const cascadeGrid = (grid: (CandyType | null)[][]): void => {
  for (let col = 0; col < GRID_SIZE; col++) {
    let writePos = GRID_SIZE - 1;

    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      if (grid[row][col] !== null) {
        grid[writePos][col] = grid[row][col];
        if (writePos !== row) {
          grid[row][col] = null;
        }
        writePos--;
      }
    }

    // Fill top with new candies
    for (let row = 0; row <= writePos; row++) {
      grid[row][col] =
        CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
    }
  }
};

/**
 * Check if game is over
 */
export const isGameOver = (state: Match3State): boolean => {
  return state.moves <= 0;
};

/**
 * Get final score
 */
export const getGameScore = (state: Match3State): number => {
  return state.score;
};
