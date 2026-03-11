const test = require('node:test');
const assert = require('node:assert');
const { findAndNormalizeScore } = require('../../admin/data-aggregator.js');

test('findAndNormalizeScore parser', async (t) => {

    await t.test('should parse /10 scores', () => {
        assert.strictEqual(findAndNormalizeScore('The rating is 8/10'), 8);
        assert.strictEqual(findAndNormalizeScore('Score: 9.5 / 10'), 9.5);
        assert.strictEqual(findAndNormalizeScore('punteggio: 7,5/10'), 7.5);
    });

    await t.test('should parse /5 scores and normalize to 10', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 4/5'), 8);
        assert.strictEqual(findAndNormalizeScore('score: 4.5 / 5'), 9);
        assert.strictEqual(findAndNormalizeScore('punteggio 3,5/5'), 7);
    });

    await t.test('should parse percentage scores and normalize to 10', () => {
        assert.strictEqual(findAndNormalizeScore('Overall 90%'), 9);
        assert.strictEqual(findAndNormalizeScore('Success rate: 85%'), 8.5);
        assert.strictEqual(findAndNormalizeScore('100% complete'), 10);
    });

    await t.test('should parse "out of 10" scores', () => {
        assert.strictEqual(findAndNormalizeScore('8.5 out of 10'), 8.5);
        assert.strictEqual(findAndNormalizeScore('7 out of 10'), 7);
    });

    await t.test('should clamp scores to a maximum of 10', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 11/10'), 10);
        assert.strictEqual(findAndNormalizeScore('Rating: 6/5'), 10);
        assert.strictEqual(findAndNormalizeScore('110%'), 10);
    });

    await t.test('should return null when no score is found', () => {
        assert.strictEqual(findAndNormalizeScore('Excellent product!'), null);
        assert.strictEqual(findAndNormalizeScore(''), null);
        assert.strictEqual(findAndNormalizeScore('Price: $100'), null);
    });

    await t.test('should handle multiple potential scores by returning the first match', () => {
        // Based on the order in SCORE_PATTERNS
        // /10 comes before /5, which comes before %
        assert.strictEqual(findAndNormalizeScore('Score: 8/10, also 4/5'), 8);
        assert.strictEqual(findAndNormalizeScore('Rating: 4/5 (80%)'), 8);
    });

    await t.test('should handle invalid number formats gracefully', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: ../10'), null);
    });
});
