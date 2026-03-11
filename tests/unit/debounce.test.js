const test = require('node:test');
const assert = require('node:assert');
const { debounce } = require('../../public/script.js');

test('debounce utility function', async (t) => {

    await t.test('should delay execution', (t, done) => {
        let executed = false;
        const debounced = debounce(() => {
            executed = true;
            done();
        }, 100);

        debounced();
        assert.strictEqual(executed, false, 'Should not execute immediately');
    });

    await t.test('should only execute once for multiple rapid calls', (t, done) => {
        let count = 0;
        const debounced = debounce(() => {
            count++;
        }, 100);

        debounced();
        debounced();
        debounced();

        setTimeout(() => {
            assert.strictEqual(count, 1, 'Should only execute once');
            done();
        }, 200);
    });

    await t.test('should execute with correct arguments', (t, done) => {
        let lastArg = '';
        const debounced = debounce((arg) => {
            lastArg = arg;
            done();
        }, 50);

        debounced('first');
        debounced('second');
        debounced('third');

        assert.strictEqual(lastArg, '', 'Should not have updated yet');
    });
});
