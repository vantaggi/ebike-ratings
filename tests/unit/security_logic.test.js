const test = require('node:test');
const assert = require('node:assert');

// Mocking the logic from server.js
const DEFAULT_SENSITIVE_FILES = '.env,.git,package.json,package-lock.json,server.js,ebike-data.json.bak';
const getSensitiveFilesSet = (envVar) => {
    const list = (envVar || DEFAULT_SENSITIVE_FILES)
        .split(',')
        .map(file => file.trim())
        .filter(file => file.length > 0);
    return new Set(list);
};

const isBlocked = (path, sensitiveFilesSet) => {
    // Block dotfiles
    if (path.includes('/.')) {
        return true;
    }

    // Block specific sensitive files by filename
    const filename = path.split('/').pop();
    if (filename && sensitiveFilesSet.has(filename)) {
        return true;
    }

    return false;
};

test('Security Logic Verification', async (t) => {
    const sensitiveFilesSet = getSensitiveFilesSet();

    await t.test('should block .env', () => {
        assert.strictEqual(isBlocked('/.env', sensitiveFilesSet), true);
    });

    await t.test('should block server.js', () => {
        assert.strictEqual(isBlocked('/server.js', sensitiveFilesSet), true);
    });

    await t.test('should block package.json', () => {
        assert.strictEqual(isBlocked('/package.json', sensitiveFilesSet), true);
    });

    await t.test('should block dotfiles in subdirectories', () => {
        assert.strictEqual(isBlocked('/sub/.git/config', sensitiveFilesSet), true);
    });

    await t.test('should block sensitive files in subdirectories', () => {
        assert.strictEqual(isBlocked('/backup/server.js', sensitiveFilesSet), true);
    });

    await t.test('should allow index.html', () => {
        assert.strictEqual(isBlocked('/index.html', sensitiveFilesSet), false);
    });

    await t.test('should allow ebike-data.json', () => {
        assert.strictEqual(isBlocked('/ebike-data.json', sensitiveFilesSet), false);
    });

    await t.test('should handle paths with trailing slashes', () => {
        assert.strictEqual(isBlocked('/some/path/', sensitiveFilesSet), false);
    });

    await t.test('should block custom sensitive files from env', () => {
        const customSet = getSensitiveFilesSet('secret.txt,config.yml');
        assert.strictEqual(isBlocked('/secret.txt', customSet), true);
        assert.strictEqual(isBlocked('/config.yml', customSet), true);
        assert.strictEqual(isBlocked('/server.js', customSet), false); // No longer blocked if not in list
    });
});
