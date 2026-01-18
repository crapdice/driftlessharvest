/**
 * Test Utilities for API Contract Testing
 * 
 * Provides HTTP request helpers and server management for testing routes.
 */

const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

/**
 * Make an HTTP request
 * @param {string} urlPath - API path (e.g., '/api/admin/stats')
 * @param {string} method - HTTP method
 * @param {Object|null} body - Request body
 * @param {string|null} token - Bearer token
 * @returns {Promise<{status: number, body: any}>}
 */
function req(urlPath, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE_URL);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname,
            method: method,
            headers: headers
        };

        const request = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                        ok: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, ok: false });
                }
            });
        });

        request.on('error', reject);
        if (body) request.write(JSON.stringify(body));
        request.end();
    });
}

/**
 * Login and get token
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<string>} Token
 */
async function login(email, password) {
    const res = await req('/api/auth/login', 'POST', { email, password });
    if (!res.body.token) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
    }
    return res.body.token;
}

/**
 * Test result tracking
 */
class TestRunner {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    async test(name, fn) {
        try {
            await fn();
            this.passed++;
            this.results.push({ name, status: 'PASS' });
            console.log(`  ✓ ${name}`);
        } catch (e) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', error: e.message });
            console.error(`  ✗ ${name}`);
            console.error(`    Error: ${e.message}`);
        }
    }

    summary() {
        console.log(`\n${this.suiteName}: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

/**
 * Simple assertion helpers
 */
const assert = {
    equal(actual, expected, msg = '') {
        if (actual !== expected) {
            throw new Error(`${msg} Expected ${expected}, got ${actual}`);
        }
    },
    ok(value, msg = '') {
        if (!value) {
            throw new Error(`${msg} Expected truthy value, got ${value}`);
        }
    },
    hasProperty(obj, prop, msg = '') {
        if (!(prop in obj)) {
            throw new Error(`${msg} Expected property '${prop}' in object`);
        }
    },
    isArray(value, msg = '') {
        if (!Array.isArray(value)) {
            throw new Error(`${msg} Expected array, got ${typeof value}`);
        }
    },
    statusOk(res, msg = '') {
        if (res.status < 200 || res.status >= 300) {
            throw new Error(`${msg} Expected 2xx status, got ${res.status}: ${JSON.stringify(res.body)}`);
        }
    },
    status(res, expected, msg = '') {
        if (res.status !== expected) {
            throw new Error(`${msg} Expected status ${expected}, got ${res.status}: ${JSON.stringify(res.body)}`);
        }
    }
};

module.exports = {
    req,
    login,
    TestRunner,
    assert,
    BASE_URL
};
