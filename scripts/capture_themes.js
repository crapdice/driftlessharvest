
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const themes = ['nature', 'legacy', 'journal', 'heritage', 'sketch'];
const outputDir = path.join(__dirname, '../_about');
const url = 'http://localhost:3000';

(async () => {
    // Ensure output dir exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const theme of themes) {
        console.log(`Processing theme: ${theme}`);

        // Set theme in localStorage
        try {
            await page.goto(url);
            await page.evaluate((t) => {
                localStorage.setItem('harvest_theme', t);
            }, theme);

            // Reload to apply theme
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 1000)); // Layout settle

            // 1. Home Page
            await page.screenshot({ path: path.join(outputDir, `${theme}_1_home.png`), fullPage: true });

            // 2. Food Boxes View
            try {
                // Find button containing "Food Boxes"
                // XPath for text content
                const [boxesButton] = await page.$x("//button[contains(., 'Food Boxes')]");
                if (boxesButton) {
                    await boxesButton.click();
                    await new Promise(r => setTimeout(r, 1000));
                    await page.screenshot({ path: path.join(outputDir, `${theme}_2_boxes.png`), fullPage: true });
                }
            } catch (e) { console.log(`[${theme}] Could not capture Boxes`, e); }

            // 3. How It Works (Scroll/Section)
            try {
                // Go back home or use setView
                await page.evaluate(() => window.setView('home'));
                await new Promise(r => setTimeout(r, 500));

                const [howButton] = await page.$x("//button[contains(., 'How It Works')]");
                if (howButton) {
                    await howButton.click();
                    await new Promise(r => setTimeout(r, 1000)); // Wait for scroll
                    await page.screenshot({ path: path.join(outputDir, `${theme}_3_how_it_works.png`), fullPage: true });
                }
            } catch (e) { console.log(`[${theme}] Could not capture How It Works`, e); }

            // 4. Cart
            try {
                // Click Cart Button
                const cartBtn = await page.$('#nav-cart-btn');
                if (cartBtn) {
                    await cartBtn.click();
                    await new Promise(r => setTimeout(r, 1000));
                    await page.screenshot({ path: path.join(outputDir, `${theme}_4_cart.png`), fullPage: true });
                }
            } catch (e) { console.log(`[${theme}] Could not capture Cart`, e); }

        } catch (err) {
            console.error(`Error processing theme ${theme}:`, err);
        }
    }

    await browser.close();
})();
