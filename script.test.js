/**
 * Tests for script.js - Math Practice Lab engine and generators.
 *
 * Loads the real script.js into jsdom so these assertions exercise the
 * production helpers (via MathPracticeHelpers), not a local reimplementation.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';

const rootDir = dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
    const source = readFileSync(join(rootDir, 'script.js'), 'utf8');
    // Classic script: evaluate in the jsdom window so function declarations bind globally.
    window.eval(source);
});

function helpers() {
    const api = globalThis.MathPracticeHelpers;
    if (!api) {
        throw new Error('MathPracticeHelpers was not exported by script.js');
    }
    return api;
}

// ============================================================================
// Tests
// ============================================================================

describe('randomInt', () => {
    it('returns values within the specified range', () => {
        const { randomInt } = helpers();
        for (let i = 0; i < 100; i++) {
            const value = randomInt(5, 10);
            expect(value).toBeGreaterThanOrEqual(5);
            expect(value).toBeLessThanOrEqual(10);
        }
    });

    it('returns integer values', () => {
        const { randomInt } = helpers();
        for (let i = 0; i < 50; i++) {
            const value = randomInt(1, 100);
            expect(Number.isInteger(value)).toBe(true);
        }
    });

    it('handles single-value range', () => {
        const { randomInt } = helpers();
        expect(randomInt(7, 7)).toBe(7);
    });

    it('handles negative ranges', () => {
        const { randomInt } = helpers();
        for (let i = 0; i < 50; i++) {
            const value = randomInt(-10, -5);
            expect(value).toBeGreaterThanOrEqual(-10);
            expect(value).toBeLessThanOrEqual(-5);
        }
    });
});

describe('randomItem', () => {
    it('returns an item from the array', () => {
        const { randomItem } = helpers();
        const items = ['a', 'b', 'c', 'd'];
        for (let i = 0; i < 50; i++) {
            expect(items).toContain(randomItem(items));
        }
    });

    it('works with single-item array', () => {
        const { randomItem } = helpers();
        expect(randomItem(['only'])).toBe('only');
    });
});

describe('shuffle', () => {
    it('returns array of same length', () => {
        const { shuffle } = helpers();
        const original = [1, 2, 3, 4, 5];
        const shuffled = shuffle(original);
        expect(shuffled).toHaveLength(original.length);
    });

    it('contains all original elements', () => {
        const { shuffle } = helpers();
        const original = [1, 2, 3, 4, 5];
        const shuffled = shuffle(original);
        expect(shuffled.sort()).toEqual(original.sort());
    });

    it('does not mutate original array', () => {
        const { shuffle } = helpers();
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        shuffle(original);
        expect(original).toEqual(copy);
    });

    it('handles empty array', () => {
        const { shuffle } = helpers();
        expect(shuffle([])).toEqual([]);
    });

    it('handles single-element array', () => {
        const { shuffle } = helpers();
        expect(shuffle([42])).toEqual([42]);
    });
});

describe('parseNumericAnswer', () => {
    it('parses positive integers', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('42')).toBe(42);
        expect(parseNumericAnswer('0')).toBe(0);
        expect(parseNumericAnswer('123')).toBe(123);
    });

    it('parses negative integers', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('-5')).toBe(-5);
        expect(parseNumericAnswer('-123')).toBe(-123);
    });

    it('trims whitespace', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('  42  ')).toBe(42);
        expect(parseNumericAnswer('\t5\n')).toBe(5);
    });

    it('returns null for empty input', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('')).toBe(null);
        expect(parseNumericAnswer('   ')).toBe(null);
    });

    it('returns null for non-numeric input', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('abc')).toBe(null);
        expect(parseNumericAnswer('12abc')).toBe(null);
        expect(parseNumericAnswer('12.5')).toBe(null);
        expect(parseNumericAnswer('1,000')).toBe(null);
    });

    it('handles number input (coerces to string)', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer(42)).toBe(42);
    });
});

describe('extractConfig', () => {
    it('extracts JSON from ```json block', () => {
        const { extractConfig } = helpers();
        const markdown = `# Title

\`\`\`json
{"id": "test", "value": 123}
\`\`\`

More content.`;
        const config = extractConfig(markdown, 'test.md');
        expect(config).toEqual({ id: 'test', value: 123 });
    });

    it('extracts JSON from ```config block', () => {
        const { extractConfig } = helpers();
        const markdown = `\`\`\`config
{"id": "test"}
\`\`\``;
        const config = extractConfig(markdown, 'test.md');
        expect(config).toEqual({ id: 'test' });
    });

    it('throws on missing config block', () => {
        const { extractConfig } = helpers();
        const markdown = '# Just a title';
        expect(() => extractConfig(markdown, 'test.md')).toThrow(/No.*config block found/);
    });

    it('throws on invalid JSON', () => {
        const { extractConfig } = helpers();
        const markdown = '```json\n{invalid}\n```';
        expect(() => extractConfig(markdown, 'test.md')).toThrow(/Could not parse/);
    });

    it('extracts first config block only', () => {
        const { extractConfig } = helpers();
        const markdown = `\`\`\`json
{"first": true}
\`\`\`

\`\`\`json
{"second": true}
\`\`\``;
        const config = extractConfig(markdown, 'test.md');
        expect(config).toEqual({ first: true });
    });
});

describe('greatestCommonDivisor', () => {
    it('finds GCD of positive numbers', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(12, 8)).toBe(4);
        expect(greatestCommonDivisor(48, 18)).toBe(6);
        expect(greatestCommonDivisor(100, 25)).toBe(25);
    });

    it('handles coprime numbers', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(7, 11)).toBe(1);
        expect(greatestCommonDivisor(8, 15)).toBe(1);
    });

    it('handles when one number divides the other', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(10, 5)).toBe(5);
        expect(greatestCommonDivisor(5, 10)).toBe(5);
    });

    it('handles negative numbers', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(-12, 8)).toBe(4);
        expect(greatestCommonDivisor(12, -8)).toBe(4);
        expect(greatestCommonDivisor(-12, -8)).toBe(4);
    });

    it('handles zero', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(0, 5)).toBe(5);
        expect(greatestCommonDivisor(5, 0)).toBe(5);
        expect(greatestCommonDivisor(0, 0)).toBe(1);  // Returns 1 as fallback
    });

    it('handles equal numbers', () => {
        const { greatestCommonDivisor } = helpers();
        expect(greatestCommonDivisor(7, 7)).toBe(7);
    });
});

describe('parseFractionProblem', () => {
    it('parses string fraction notation', () => {
        const { parseFractionProblem } = helpers();
        expect(parseFractionProblem('3/4')).toEqual([3, 4]);
        expect(parseFractionProblem('12/15')).toEqual([12, 15]);
    });

    it('handles whitespace in string', () => {
        const { parseFractionProblem } = helpers();
        expect(parseFractionProblem('  3 / 4  ')).toEqual([3, 4]);
    });

    it('parses array notation', () => {
        const { parseFractionProblem } = helpers();
        expect(parseFractionProblem([3, 4])).toEqual([3, 4]);
        expect(parseFractionProblem(['6', '8'])).toEqual([6, 8]);
    });

    it('throws on invalid format', () => {
        const { parseFractionProblem } = helpers();
        expect(() => parseFractionProblem('invalid')).toThrow(/Invalid simplify-fractions problem/);
        expect(() => parseFractionProblem('3-4')).toThrow(/Invalid simplify-fractions problem/);
    });
});

describe('fractionKey', () => {
    it('creates correct key format', () => {
        const { fractionKey } = helpers();
        expect(fractionKey(3, 4)).toBe('3/4');
        expect(fractionKey(1, 2)).toBe('1/2');
        expect(fractionKey(12, 15)).toBe('12/15');
    });
});

describe('computeRounded', () => {
    it('rounds to whole number correctly', () => {
        const { computeRounded } = helpers();
        expect(computeRounded({ whole: 5, d1: 4, d2: 9, d3: 9 }, 'whole number')).toBe('5');
        expect(computeRounded({ whole: 5, d1: 5, d2: 0, d3: 1 }, 'whole number')).toBe('6');
        expect(computeRounded({ whole: 3, d1: 2, d2: 4, d3: 9 }, 'whole number')).toBe('3');
    });

    it('rounds to tenth correctly', () => {
        const { computeRounded } = helpers();
        expect(computeRounded({ whole: 5, d1: 4, d2: 4, d3: 9 }, 'tenth')).toBe('5.4');
        expect(computeRounded({ whole: 5, d1: 4, d2: 5, d3: 1 }, 'tenth')).toBe('5.5');
        expect(computeRounded({ whole: 2, d1: 9, d2: 9, d3: 5 }, 'tenth')).toBe('3.0');
    });

    it('rounds to hundredth correctly', () => {
        const { computeRounded } = helpers();
        expect(computeRounded({ whole: 5, d1: 4, d2: 5, d3: 4 }, 'hundredth')).toBe('5.45');
        expect(computeRounded({ whole: 5, d1: 4, d2: 5, d3: 5 }, 'hundredth')).toBe('5.46');
        expect(computeRounded({ whole: 1, d1: 2, d2: 3, d3: 4 }, 'hundredth')).toBe('1.23');
    });

    it('pads hundredths with leading zero', () => {
        const { computeRounded } = helpers();
        expect(computeRounded({ whole: 1, d1: 0, d2: 4, d3: 5 }, 'hundredth')).toBe('1.05');
    });
});

describe('arithmeticCandidateKey', () => {
    it('normalizes multiply keys (commutative)', () => {
        const { arithmeticCandidateKey } = helpers();
        expect(arithmeticCandidateKey('multiply', 3, 5)).toBe('multiply:3:5');
        expect(arithmeticCandidateKey('multiply', 5, 3)).toBe('multiply:3:5');
    });

    it('normalizes add keys (commutative)', () => {
        const { arithmeticCandidateKey } = helpers();
        expect(arithmeticCandidateKey('add', 3, 5)).toBe('add:3:5');
        expect(arithmeticCandidateKey('add', 5, 3)).toBe('add:3:5');
    });

    it('normalizes subtract keys (commutative for deduplication)', () => {
        const { arithmeticCandidateKey } = helpers();
        expect(arithmeticCandidateKey('subtract', 3, 5)).toBe('subtract:3:5');
        expect(arithmeticCandidateKey('subtract', 5, 3)).toBe('subtract:3:5');
    });

    it('preserves divide key order (non-commutative)', () => {
        const { arithmeticCandidateKey } = helpers();
        expect(arithmeticCandidateKey('divide', 3, 5)).toBe('divide:3:5');
        expect(arithmeticCandidateKey('divide', 5, 3)).toBe('divide:5:3');
    });
});

describe('buildArithmeticDeck', () => {
    it('creates deck with default config', () => {
        const { buildArithmeticDeck } = helpers();
        const config = {};
        const deck = buildArithmeticDeck(config);

        // Default is multiply with factors 2-12, which gives 11*11 = 121 pairs
        // minus duplicates due to commutativity = 66 unique pairs
        expect(deck.length).toBe(66);
        expect(deck.every(c => c.operation === 'multiply')).toBe(true);
    });

    it('respects custom factor ranges', () => {
        const { buildArithmeticDeck } = helpers();
        const config = {
            operations: ['multiply'],
            factorA: { min: 2, max: 4 },
            factorB: { min: 2, max: 4 }
        };
        const deck = buildArithmeticDeck(config);

        // 3x3 = 9 pairs, minus duplicates = 6 unique
        expect(deck.length).toBe(6);
        deck.forEach(c => {
            expect(c.a).toBeGreaterThanOrEqual(2);
            expect(c.a).toBeLessThanOrEqual(4);
            expect(c.b).toBeGreaterThanOrEqual(2);
            expect(c.b).toBeLessThanOrEqual(4);
        });
    });

    it('includes all specified operations', () => {
        const { buildArithmeticDeck } = helpers();
        const config = {
            operations: ['add', 'subtract'],
            factorA: { min: 1, max: 3 },
            factorB: { min: 1, max: 3 }
        };
        const deck = buildArithmeticDeck(config);

        const operations = new Set(deck.map(c => c.operation));
        expect(operations.has('add')).toBe(true);
        expect(operations.has('subtract')).toBe(true);
    });

    it('removes duplicate commutative pairs', () => {
        const { buildArithmeticDeck } = helpers();
        const config = {
            operations: ['multiply'],
            factorA: { min: 2, max: 3 },
            factorB: { min: 2, max: 3 }
        };
        const deck = buildArithmeticDeck(config);

        // 2x2, 2x3, 3x3 = 3 unique pairs
        expect(deck.length).toBe(3);
    });
});

describe('generateRoundingNumber', () => {
    it('generates valid number structure', () => {
        const { generateRoundingNumber } = helpers();
        for (let i = 0; i < 50; i++) {
            const num = generateRoundingNumber();

            expect(num).toHaveProperty('whole');
            expect(num).toHaveProperty('d1');
            expect(num).toHaveProperty('d2');
            expect(num).toHaveProperty('d3');

            expect(num.whole).toBeGreaterThanOrEqual(1);
            expect(num.whole).toBeLessThanOrEqual(999);
            expect(num.d1).toBeGreaterThanOrEqual(0);
            expect(num.d1).toBeLessThanOrEqual(9);
            expect(num.d2).toBeGreaterThanOrEqual(0);
            expect(num.d2).toBeLessThanOrEqual(9);
            expect(num.d3).toBeGreaterThanOrEqual(1);  // d3 is 1-9
            expect(num.d3).toBeLessThanOrEqual(9);
        }
    });
});

describe('Fraction simplification logic', () => {
    it('correctly identifies simplified fractions', () => {
        const { greatestCommonDivisor } = helpers();
        // Test that GCD-based simplification works
        const testCases = [
            { num: 6, den: 8, simplified: [3, 4] },
            { num: 15, den: 25, simplified: [3, 5] },
            { num: 12, den: 18, simplified: [2, 3] },
            { num: 7, den: 11, simplified: [7, 11] },  // Already simplified
            { num: 100, den: 250, simplified: [2, 5] },
        ];

        testCases.forEach(({ num, den, simplified }) => {
            const gcd = greatestCommonDivisor(num, den);
            const simplifiedNum = num / gcd;
            const simplifiedDen = den / gcd;
            expect([simplifiedNum, simplifiedDen]).toEqual(simplified);
        });
    });
});

describe('Edge cases', () => {
    it('shuffle handles large arrays', () => {
        const { shuffle } = helpers();
        const large = Array.from({ length: 1000 }, (_, i) => i);
        const shuffled = shuffle(large);
        expect(shuffled).toHaveLength(1000);
        expect(new Set(shuffled).size).toBe(1000);
    });

    it('parseNumericAnswer handles edge numeric strings', () => {
        const { parseNumericAnswer } = helpers();
        expect(parseNumericAnswer('0')).toBe(0);
        // Number('-0') is -0; Object.is treats -0 and +0 as distinct
        expect(Object.is(parseNumericAnswer('-0'), -0)).toBe(true);
        expect(parseNumericAnswer('-0') === 0).toBe(true);
        expect(parseNumericAnswer('999999999')).toBe(999999999);
    });

    it('extractConfig handles complex JSON', () => {
        const { extractConfig } = helpers();
        const markdown = `\`\`\`json
{
    "id": "test",
    "nested": {
        "array": [1, 2, 3],
        "object": {"key": "value"}
    },
    "unicode": "αβγ"
}
\`\`\``;
        const config = extractConfig(markdown, 'test.md');
        expect(config.nested.array).toEqual([1, 2, 3]);
        expect(config.unicode).toBe('αβγ');
    });
});

describe('script.js load path', () => {
    it('exposes helpers from the real script.js file', () => {
        expect(globalThis.MathPracticeHelpers).toBeDefined();
        expect(typeof globalThis.MathPracticeHelpers.shuffle).toBe('function');
        expect(typeof globalThis.MathPracticeHelpers.buildArithmeticDeck).toBe('function');
    });
});
