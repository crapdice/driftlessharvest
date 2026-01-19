const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        console.log('Starting Repro Test...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. Login as Admin
        console.log('Logging in...');
        try {
            await page.goto('http://localhost:3000/admin/index.html', { timeout: 10000 });
        } catch (e) {
            console.error('Failed to load admin page. Is server running?', e);
            process.exit(1);
        }

        await page.waitForSelector('#login-email', { timeout: 5000 });
        await page.type('#login-email', 'admin@driftless.com');
        await page.type('#login-password', 'harvest123');
        await page.click('button[type="submit"]');

        // Wait for login to complete (check for sidebar)
        await page.waitForSelector('aside nav button', { timeout: 10000 });
        console.log('Login successful.');

        // 2. Enable Launch Mode via API
        console.log('Enabling Launch Mode...');
        const configEnable = await page.evaluate(async () => {
            try {
                const res = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meta: {
                            launchModeEnabled: true,
                            activeLaunchVariant: 'Hearth & Harvest (Design 1)'
                        }
                    })
                });
                return res.status;
            } catch (e) {
                return e.toString();
            }
        });

        console.log(`Config update result: ${configEnable}`);
        if (configEnable !== 200) {
            throw new Error(`Failed to enable Launch Mode: ${configEnable}`);
        }

        // 3. Navigate to Marketing
        console.log('Navigating to /marketing...');
        await page.goto('http://localhost:3000/marketing', { waitUntil: 'networkidle0', timeout: 10000 });

        // 4. Assertions
        const url = page.url();
        console.log(`Current URL: ${url}`);

        if (url.includes('/admin/index.html') && !url.includes('redirect')) {
            console.error('FAIL: Redirected to admin/login without redirect param!');
            process.exit(1);
        }

        // Wait for potential client-side redirects to settle
        await new Promise(r => setTimeout(r, 2000));

        const finalUrl = page.url();
        console.log(`Final URL: ${finalUrl}`);

        // Success if we are on marketing OR on admin with redirect AND the modal is closed (because we entered with valid cookie?) 
        // Actually, if we are on marketing, we succeded.
        // If we were redirected to admin with ?redirect=, then we need to check if we are auto-redirected back OR if the login modal is shown.
        // With my fix, initAuth() checks cookie. If cookie is valid (which it is from step 1), it should NOT show login modal, but just render header user.
        // Wait, initAuth checks cookie via /api/user/profile.

        // Let's check page title or unique element
        const pageTitle = await page.title();
        console.log(`Page Title: ${pageTitle}`);

        if (finalUrl.includes('/marketing')) {
            console.log('SUCCESS: Stayed on Marketing Page.');
        } else if (finalUrl.includes('redirect=/marketing')) {
            // We were redirected to admin. Did we get logged in automatically?
            // If the cookie is valid, initAuth should have authenticated us.
            // But wait, marketing.js has its own check.
            console.log('INFO: Redirected to admin with param. Checking if session passes...');
            const modalVisible = await page.evaluate(() => {
                const modal = document.getElementById('login-modal');
                return modal && modal.style.display !== 'none';
            });

            if (modalVisible) {
                console.error('FAIL: Login modal is visible despite being logged in!');
                process.exit(1);
            } else {
                console.log('SUCCESS: Login modal hidden. Session valid.');
            }
        } else {
            console.log('UNKNOWN STATE');
        }

    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
