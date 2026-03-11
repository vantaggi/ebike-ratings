const test = require('node:test');
const assert = require('node:assert');
const { findAndNormalizeScore } = require('../../admin/data-aggregator.js');

test('findAndNormalizeScore Rating Parser', async (t) => {

    await t.test('should parse standard /10 ratings with keywords', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 8.5/10'), 8.5);
        assert.strictEqual(findAndNormalizeScore('Score: 7/10'), 7);
        assert.strictEqual(findAndNormalizeScore('Punteggio: 9.2/10'), 9.2);
    });

    await t.test('should parse standard /5 ratings with keywords', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 4/5'), 8);
        assert.strictEqual(findAndNormalizeScore('score: 4.5/5'), 9);
        assert.strictEqual(findAndNormalizeScore('punteggio: 3.5/5'), 7);
    });

    await t.test('should parse percentage ratings', () => {
        assert.strictEqual(findAndNormalizeScore('95%'), 9.5);
        assert.strictEqual(findAndNormalizeScore('80 %'), 8);
        assert.strictEqual(findAndNormalizeScore('100%'), 10);
        assert.strictEqual(findAndNormalizeScore('0%'), 0);
    });

    await t.test('should parse "out of 10" ratings', () => {
        assert.strictEqual(findAndNormalizeScore('9 out of 10'), 9);
        assert.strictEqual(findAndNormalizeScore('8.2 out of 10'), 8.2);
    });

    await t.test('should handle comma as decimal separator', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 8,5/10'), 8.5);
        assert.strictEqual(findAndNormalizeScore('Score: 4,5/5'), 9);
    });

    await t.test('should cap scores at 10', () => {
        assert.strictEqual(findAndNormalizeScore('110%'), 10);
        assert.strictEqual(findAndNormalizeScore('Score: 11/10'), 10);
        assert.strictEqual(findAndNormalizeScore('Rating: 6/5'), 10);
    });

    await t.test('should return null if no score is found', () => {
        assert.strictEqual(findAndNormalizeScore('This is a great product with no rating.'), null);
        assert.strictEqual(findAndNormalizeScore(''), null);
    });

    await t.test('should handle multiple potential scores by returning the first match', () => {
        assert.strictEqual(findAndNormalizeScore('Rating: 8/10, overall 90%'), 8);
    });
});
