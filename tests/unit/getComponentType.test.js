const test = require('node:test');
const assert = require('node:assert');
const { getComponentType } = require('../../public/script.js');

test('getComponentType Mapping', async (t) => {

    await t.test('should map Italian names to English plural identifiers', () => {
        assert.strictEqual(getComponentType('Motore'), 'motori');
        assert.strictEqual(getComponentType('Batteria'), 'batterie');
        assert.strictEqual(getComponentType('Freni'), 'freni');
        assert.strictEqual(getComponentType('Forcella'), 'sospensioni');
        assert.strictEqual(getComponentType('Ammortizzatore'), 'sospensioni');
    });

    await t.test('should return an empty string for unknown component names', () => {
        assert.strictEqual(getComponentType('Telaio'), '');
        assert.strictEqual(getComponentType('Ruote'), '');
        assert.strictEqual(getComponentType('Manubrio'), '');
    });

    await t.test('should return an empty string for empty input', () => {
        assert.strictEqual(getComponentType(''), '');
    });

    await t.test('should handle null or undefined input gracefully', () => {
        assert.strictEqual(getComponentType(null), '');
        assert.strictEqual(getComponentType(undefined), '');
    });

    await t.test('should be case sensitive (matching current implementation)', () => {
        // Based on the switch statement, it is case sensitive
        assert.strictEqual(getComponentType('motore'), '');
        assert.strictEqual(getComponentType('BATTERIA'), '');
    });
});
