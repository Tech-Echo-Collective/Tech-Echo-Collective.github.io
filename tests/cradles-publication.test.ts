import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const gameDirectory = path.join(
  process.cwd(),
  'public',
  'games',
  'cradles-of-civilization',
);

describe('Cradles of Civilization public build', () => {
  it('contains the complete browser runtime', () => {
    for (const filename of [
      'index.html',
      'ending.html',
      'styles.css',
      'game.js',
      'balance-model.js',
      'endings.js',
      'assets/governor-east-asian-man.png',
      'assets/governor-white-woman.png',
      'assets/governor-black-man.png',
      'assets/governor-trisolaran-listener.png',
    ]) {
      expect(fs.existsSync(path.join(gameDirectory, filename)), filename).toBe(true);
    }
  });

  it('keeps navigation and assets inside the published subdirectory', () => {
    const index = fs.readFileSync(path.join(gameDirectory, 'index.html'), 'utf8');
    const ending = fs.readFileSync(path.join(gameDirectory, 'ending.html'), 'utf8');
    const game = fs.readFileSync(path.join(gameDirectory, 'game.js'), 'utf8');

    expect(index).toContain('href="styles.css');
    expect(index).toContain('src="game.js');
    expect(index).toContain('src="assets/');
    expect(ending).toContain('href="styles.css');
    expect(game).toContain('const ENDING_PAGE = "ending.html"');
    expect(index).toContain('href="https://techecho.org/"');
    expect(ending).toContain('href="https://techecho.org/"');
  });
});
