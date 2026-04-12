/**
 * Match-3 Game Scene (Phaser 3)
 * Candy Crush style puzzle game
 * 8x8 grid, touch controls, animations
 */

import Phaser from 'phaser';

const GRID_SIZE = 8;
const TILE_SIZE = 48;
const PADDING = 16;
const COLORS: Record<string, number> = {
  red: 0xff6b6b,
  blue: 0x4ecdc4,
  green: 0x95e1d3,
  yellow: 0xffd93d,
  purple: 0xb19cd9,
  orange: 0xffb347
};

export class Match3Scene extends Phaser.Scene {
  private grid: (string | null)[][] = [];
  private tiles: Phaser.Physics.Arcade.Sprite[][] = [];
  private selectedTile: [number, number] | null = null;
  private score: number = 0;
  private moves: number = 30;
  private isAnimating: boolean = false;
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;

  constructor() {
    super('Match3Scene');
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#0a0e1a');

    // Initialize grid
    this.initializeGrid();
    this.createGridDisplay();

    // UI
    this.createUI();

    // Input handling
    this.input.on('pointerdown', this.handleTileClick, this);
  }

  private initializeGrid() {
    const CANDY_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    this.grid = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(
            () => CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)]
          )
      );
  }

  private createGridDisplay() {
    this.tiles = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE));

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = PADDING + col * TILE_SIZE + TILE_SIZE / 2;
        const y = PADDING + 80 + row * TILE_SIZE + TILE_SIZE / 2;
        const candy = this.grid[row][col];

        const tile = this.add.circle(x, y, TILE_SIZE / 2 - 2, COLORS[candy!]);
        tile.setInteractive();
        tile.setName(`tile_${row}_${col}`);

        this.tiles[row][col] = tile as any;
      }
    }
  }

  private handleTileClick(pointer: Phaser.Input.Pointer) {
    const x = pointer.x;
    const y = pointer.y - 80; // Account for UI

    const col = Math.floor((x - PADDING) / TILE_SIZE);
    const row = Math.floor((y - PADDING) / TILE_SIZE);

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    if (!this.selectedTile) {
      this.selectedTile = [row, col];
      this.tiles[row][col].setScale(1.1);
      return;
    }

    const [prevRow, prevCol] = this.selectedTile;
    const distance = Math.abs(row - prevRow) + Math.abs(col - prevCol);

    if (distance === 1) {
      // Valid swap
      this.swapTiles(prevRow, prevCol, row, col);
      this.moves -= 1;
    }

    this.tiles[prevRow][prevCol].setScale(1);
    this.selectedTile = null;
  }

  private swapTiles(r1: number, c1: number, r2: number, c2: number) {
    this.isAnimating = true;

    // Swap in grid
    [this.grid[r1][c1], this.grid[r2][c2]] = [
      this.grid[r2][c2],
      this.grid[r1][c1]
    ];

    // Animate swap
    const tile1 = this.tiles[r1][c1];
    const tile2 = this.tiles[r2][c2];
    const x1 = tile1.x;
    const y1 = tile1.y;
    const x2 = tile2.x;
    const y2 = tile2.y;

    this.tweens.add({
      targets: [tile1, tile2],
      x: [x1, x2],
      y: [y1, y2],
      duration: 200,
      onComplete: () => {
        this.processMatches();
      }
    });
  }

  private processMatches() {
    const matches = this.findMatches();

    if (matches.size === 0) {
      this.isAnimating = false;
      this.updateUI();
      return;
    }

    // Clear matched tiles
    matches.forEach(match => {
      const [row, col] = match.split(',').map(Number);
      this.score += 10;
      this.tiles[row][col].destroy();
    });

    // Cascade candies
    this.cascadeGrid();

    // Recursively check for more matches
    this.time.delayedCall(400, () => this.processMatches());
  }

  private findMatches(): Set<string> {
    const matches = new Set<string>();

    // Horizontal
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const candy = this.grid[row][col];
        if (
          candy &&
          candy === this.grid[row][col + 1] &&
          candy === this.grid[row][col + 2]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row},${col + 1}`);
          matches.add(`${row},${col + 2}`);
        }
      }
    }

    // Vertical
    for (let row = 0; row < GRID_SIZE - 2; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const candy = this.grid[row][col];
        if (
          candy &&
          candy === this.grid[row + 1][col] &&
          candy === this.grid[row + 2][col]
        ) {
          matches.add(`${row},${col}`);
          matches.add(`${row + 1},${col}`);
          matches.add(`${row + 2},${col}`);
        }
      }
    }

    return matches;
  }

  private cascadeGrid() {
    // Implement cascade logic (drop candies, fill with new ones)
    // Simplified version for now
    this.time.delayedCall(300, () => {
      this.createGridDisplay();
    });
  }

  private createUI() {
    this.scoreText = this.add.text(16, 16, `SCORE: ${this.score}`, {
      font: '24px Arial',
      color: '#ffffff'
    });

    this.movesText = this.add.text(
      this.game.canvas.width - 16,
      16,
      `MOVES: ${this.moves}`,
      {
        font: '24px Arial',
        color: '#ffffff',
        align: 'right'
      }
    );
    this.movesText.setOrigin(1, 0);
  }

  private updateUI() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.movesText.setText(`MOVES: ${this.moves}`);

    if (this.moves <= 0) {
      this.add.text(this.game.canvas.width / 2, this.game.canvas.height / 2, 'GAME OVER', {
        font: '48px Arial',
        color: '#ff6b6b',
        align: 'center'
      }).setOrigin(0.5);
    }
  }
}
