const assert = require('node:assert');
const test = require('node:test');
const rateLimit = require('../../middleware/rate-limiter');

test('rateLimit middleware', async (t) => {
    await t.test('should allow requests under the limit', () => {
        const limiter = rateLimit({ windowMs: 1000, max: 5 });
        const req = { ip: '127.0.0.1' };
        let nextCalled = 0;
        const next = () => { nextCalled++; };
        const res = {
            status: () => res,
            json: () => res
        };

        for (let i = 0; i < 5; i++) {
            limiter(req, res, next);
        }

        assert.strictEqual(nextCalled, 5);
    });

    await t.test('should block requests over the limit', () => {
        const limiter = rateLimit({ windowMs: 1000, max: 5, message: 'Limit reached' });
        const req = { ip: '127.0.0.1' };
        let nextCalled = 0;
        const next = () => { nextCalled++; };
        let statusCode = 0;
        let responseBody = null;
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (obj) => {
                responseBody = obj;
                return res;
            }
        };

        for (let i = 0; i < 5; i++) {
            limiter(req, res, next);
        }
        assert.strictEqual(nextCalled, 5);

        // 6th request should be blocked
        limiter(req, res, next);
        assert.strictEqual(nextCalled, 5);
        assert.strictEqual(statusCode, 429);
        assert.strictEqual(responseBody.message, 'Limit reached');
    });

    await t.test('should use separate buckets for different IPs', () => {
        const limiter = rateLimit({ windowMs: 1000, max: 1 });
        const req1 = { ip: '1.1.1.1' };
        const req2 = { ip: '2.2.2.2' };
        let nextCalled = 0;
        const next = () => { nextCalled++; };
        const res = {
            status: () => res,
            json: () => res
        };

        limiter(req1, res, next);
        assert.strictEqual(nextCalled, 1);

        limiter(req2, res, next);
        assert.strictEqual(nextCalled, 2);

        // req1 should be blocked now
        limiter(req1, res, next);
        assert.strictEqual(nextCalled, 2);
    });

    await t.test('should cleanup stale entries', async () => {
        // Use a short window for testing cleanup
        const limiter = rateLimit({ windowMs: 100, max: 1 });
        const req = { ip: '9.9.9.9' };
        const next = () => {};
        const res = { status: () => res, json: () => res };

        limiter(req, res, next);
        assert.strictEqual(limiter._requests.has('9.9.9.9'), true);

        // Manually trigger cleanup after window expires
        await new Promise(resolve => setTimeout(resolve, 150));
        limiter._cleanup();

        assert.strictEqual(limiter._requests.has('9.9.9.9'), false);
    });
});
