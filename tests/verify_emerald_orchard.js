const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

async function runTest() {
    console.log('[Verification] Starting Emerald Orchard Authenticated Smoke Test...');

    // Generate a dummy admin token
    const token = jwt.sign({
        id: 1,
        email: 'admin@driftlessharvest.com',
        role: 'admin'
    }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        const baseUrl = 'http://localhost:3000';

        // 1. Visit admin login to establish context
        await page.goto(`${baseUrl}/admin/index.html`);

        // 2. Inject token
        await page.evaluate((t) => {
            localStorage.setItem('harvest_token', t);
        }, token);

        // 3. Navigate to marketing dashboard (should now bypass guard)
        await page.goto(`${baseUrl}/marketing`, { waitUntil: 'networkidle2' });

        // 4. Verification steps
        const title = await page.title();
        console.log(`[Log] Page Title: ${title}`);
        if (!title.includes('The Emerald Orchard')) {
            throw new Error(`Title verification failed. Got: ${title}`);
        }

        const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
        console.log(`[Log] H1 Text: ${h1}`);
        if (!h1 || !h1.includes('The Emerald Orchard')) {
            throw new Error('H1 text verification failed');
        }

        const hasBezier = await page.evaluate(() => {
            const svg = document.querySelector('#velocity-chart svg');
            return !!svg;
        });
        console.log(`[Log] Has Smooth Chart: ${hasBezier}`);

        console.log('[Verification] SUCCESS: Emerald Orchard is fully operational.');
    } catch (e) {
        console.error('[Verification] FAILED:', e.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTest();
