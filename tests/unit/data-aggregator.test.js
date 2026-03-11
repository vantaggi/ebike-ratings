const test = require('node:test');
const assert = require('node:assert');
const { findAndNormalizeScore } = require('../../admin/data-aggregator.js');

test('findAndNormalizeScore', async (t) => {

    await t.test('should normalize scores out of 10', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 8/10'), 8);
        assert.strictEqual(findAndNormalizeScore('score: 8.5/10'), 8.5);
        assert.strictEqual(findAndNormalizeScore('punteggio: 9,2/10'), 9.2);
        assert.strictEqual(findAndNormalizeScore('8.5 out of 10'), 8.5);
    });

    await t.test('should normalize scores out of 5', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 4/5'), 8);
        assert.strictEqual(findAndNormalizeScore('score: 4.5/5'), 9);
        assert.strictEqual(findAndNormalizeScore('punteggio: 3,5/5'), 7);
    });

    await t.test('should normalize percentages', () => {
        assert.strictEqual(findAndNormalizeScore('95%'), 9.5);
        assert.strictEqual(findAndNormalizeScore('80 %'), 8);
        assert.strictEqual(findAndNormalizeScore('100%'), 10);
    });

    await t.test('should handle different decimal separators', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 8.5/10'), 8.5);
        assert.strictEqual(findAndNormalizeScore('Rating: 8,5/10'), 8.5);
    });

    await t.test('should be case insensitive for labels', () => {
        assert.strictEqual(findAndNormalizeScore('RATING: 9/10'), 9);
        assert.strictEqual(findAndNormalizeScore('Score: 9/10'), 9);
        assert.strictEqual(findAndNormalizeScore('punteggio: 9/10'), 9);
    });

    await t.test('should cap scores at 10', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 11/10'), 10);
        assert.strictEqual(findAndNormalizeScore('Rating: 6/5'), 10);
        assert.strictEqual(findAndNormalizeScore('110%'), 10);
    });

    await t.test('should return null if no score is found', () => {
        assert.strictEqual(findAndNormalizeScore('No rating here'), null);
        assert.strictEqual(findAndNormalizeScore('Rating: excellent'), null);
    });

    await t.test('should handle invalid numbers gracefully', () => {
        // This tests the 'if (isNaN(score)) continue;' line
        // We need a regex match where group 1 is not a valid number
        // Based on the regex, this might be hard to hit with current patterns
        // but let's try to pass something that matches but isn't a number if possible.
        // The regexes (\d{1,2}(?:[.,]\d{1,2})?) already ensure digits.
        assert.strictEqual(findAndNormalizeScore('Rating: ../10'), null);
    });
});
