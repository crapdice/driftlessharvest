const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        args: ['--disable-web-security', '--allow-file-access-from-files']
    });
    const page = await browser.newPage();

    // Listen for console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const url = 'file://' + path.join(__dirname, 'index.html');
    console.log(`Loading ${url}...`);

    await page.goto(url);

    // Wait for result
    const result = await page.waitForFunction('window.__TEST_RESULT__ !== undefined', { timeout: 5000 }).catch(() => null);

    if (result) {
        const passed = await page.evaluate(() => window.__TEST_RESULT__);
        if (passed) {
            console.log('\n✨ UI TESTS PASSED ✨');
            await browser.close();
            process.exit(0);
        } else {
            console.error('\n💀 UI TESTS FAILED');
            await browser.close();
            process.exit(1);
        }
    } else {
        console.error('\n⏱️ TIMEOUT');
        await browser.close();
        process.exit(1);
    }
})();
