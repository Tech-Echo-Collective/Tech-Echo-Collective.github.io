import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceDirectories = ['app', 'components', 'lib'];
const permittedExtendedPictographs = new Set([0x00a9]);
const retiredCharacterIcons = new Set(
  [
    0x00d7, 0x2190, 0x2191, 0x2192, 0x2193, 0x2197, 0x223f, 0x2261, 0x2301, 0x25a3, 0x25c7,
    0x25c9, 0x25cb, 0x25ce, 0x2665, 0x2713,
  ].map((codePoint) => String.fromCodePoint(codePoint)),
);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [entryPath] : [];
  });
}

describe('built-in interface character policy', () => {
  it('keeps emoji and retired character icons out of authored UI source', () => {
    const violations = sourceDirectories.flatMap((directory) =>
      sourceFiles(directory).flatMap((filename) => {
        const source = readFileSync(filename, 'utf8');
        return Array.from(source).flatMap((character, index) => {
          const codePoint = character.codePointAt(0)!;
          const isEmoji =
            /\p{Extended_Pictographic}/u.test(character) &&
            !permittedExtendedPictographs.has(codePoint);
          const isPresentationControl = codePoint === 0xfe0f || codePoint === 0x200d;
          return isEmoji || isPresentationControl || retiredCharacterIcons.has(character)
            ? [`${filename}:${index}:${codePoint.toString(16)}`]
            : [];
        });
      }),
    );

    expect(violations).toEqual([]);
  });
});
