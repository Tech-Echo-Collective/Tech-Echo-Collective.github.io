import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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
      'localization.js',
      'game.js',
      'balance-model.js',
      'endings.js',
      'map-lab/index.html',
      'map-lab/map-data.js',
      'map-lab/map-model.js',
      'map-lab/map-lab.js',
      'map-lab/map-lab.css',
      'assets/governor-east-asian-man.png',
      'assets/governor-white-woman.png',
      'assets/governor-black-man.png',
      'assets/governor-trisolaran-listener.png',
    ]) {
      expect(fs.existsSync(path.join(gameDirectory, filename)), filename).toBe(true);
    }
  });

  it('publishes every local page dependency under the game path', () => {
    const origin = 'https://techecho.org';
    const basePath = '/games/cradles-of-civilization/';
    for (const filename of ['index.html', 'ending.html', 'map-lab/index.html']) {
      const html = fs.readFileSync(path.join(gameDirectory, filename), 'utf8');
      const pageUrl = new URL(basePath + filename, origin);
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const reference = match[1];
        if (/^(?:https?:|#)/.test(reference)) continue;
        const assetUrl = new URL(reference, pageUrl);
        expect(assetUrl.pathname.startsWith(basePath), reference).toBe(true);
        const assetPath = assetUrl.pathname.slice(basePath.length);
        expect(fs.existsSync(path.join(gameDirectory, assetPath)), reference).toBe(true);
      }
    }
  });

  it('loads the shared 64-province geography before its consumers', () => {
    const scriptsIn = (filename: string) =>
      Array.from(
        fs
          .readFileSync(path.join(gameDirectory, filename), 'utf8')
          .matchAll(/<script\s+src="([^"?]+)(?:\?[^"]*)?"/g),
        (match) => match[1],
      );
    expect(scriptsIn('index.html')).toEqual([
      'map-lab/map-data.js',
      'localization.js',
      'endings.js',
      'balance-model.js',
      'map-lab/map-model.js',
      'game.js',
    ]);
    expect(scriptsIn('ending.html')).toEqual([
      'map-lab/map-data.js',
      'localization.js',
      'endings.js',
    ]);
    const context = vm.createContext({});
    vm.runInContext(
      fs.readFileSync(path.join(gameDirectory, 'map-lab/map-data.js'), 'utf8'),
      context,
    );
    expect(context.CRADLES_MAP_LAB_DATA.provinces).toHaveLength(64);
    expect(context.CRADLES_MAP_LAB_DATA.strategicRegions).toHaveLength(10);
  });

  it('preserves the original actions and language-specific ending presentation', () => {
    const index = fs.readFileSync(path.join(gameDirectory, 'index.html'), 'utf8');
    const ending = fs.readFileSync(path.join(gameDirectory, 'ending.html'), 'utf8');
    const game = fs.readFileSync(path.join(gameDirectory, 'game.js'), 'utf8');
    expect(index.match(/data-action="/g)).toHaveLength(21);
    expect(ending).toMatch(/endingTitleLines = I18N\.isEnglish\(\)\s*\? \[endingNameEn\]/);
    expect(ending).toContain('[endingNameZh, endingNameEn]');
    expect(ending).toContain(
      'url.searchParams.set("lang", I18N.isEnglish() ? "en" : "zh")',
    );
    expect(game).toContain('url.searchParams.set("lang", I18N.isEnglish() ? "en" : "zh")');
    expect(index).toContain('20260905-ending-polish');
    expect(ending).toContain('20260905-ending-polish');
    expect(index).not.toContain('← Tech Echo');
    expect(ending).not.toContain('← Tech Echo');
  });

  it('keeps navigation and assets inside the published subdirectory', () => {
    const index = fs.readFileSync(path.join(gameDirectory, 'index.html'), 'utf8');
    const ending = fs.readFileSync(path.join(gameDirectory, 'ending.html'), 'utf8');
    const game = fs.readFileSync(path.join(gameDirectory, 'game.js'), 'utf8');
    const localization = fs.readFileSync(
      path.join(gameDirectory, 'localization.js'),
      'utf8',
    );
    const endings = fs.readFileSync(path.join(gameDirectory, 'endings.js'), 'utf8');

    expect(index).toContain('href="styles.css');
    expect(index).toContain('id="languageToggle"');
    expect(index).toContain('src="localization.js');
    expect(index).toContain('src="game.js');
    expect(index).toContain('src="assets/');
    expect(ending).toContain('href="styles.css');
    expect(ending).toContain('id="languageToggle"');
    expect(ending).toContain('src="localization.js');
    expect(game).toContain('const ENDING_PAGE = "ending.html"');
    expect(game).toContain('I18N.init()');
    expect(localization).toContain('three-sun-chronicle:language:v1');
    expect(localization).toContain('searchParams.get("lang")');
    expect(endings.match(/nameEn:/g)).toHaveLength(12);
    expect(endings.match(/paragraphsEn:/g)).toHaveLength(12);
    expect(endings.match(/quoteEn:/g)).toHaveLength(12);
    expect(index).toContain('href="https://techecho.org/"');
    expect(ending).toContain('href="https://techecho.org/"');
  });
});
