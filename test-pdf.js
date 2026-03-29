const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
  console.log('Starting PDF export test...');
  
  const downloads = [];
  
  try {
    const execPath = process.platform === 'darwin' 
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined;
    
    const browser = await chromium.launch({ 
      headless: true,
      executablePath: execPath,
    });
    
    const context = await browser.newContext({
      acceptDownloads: true
    });
    const page = await context.newPage();
    
    // Track console messages
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    await page.goto('http://localhost:3000/test-pdf', { timeout: 15000 });
    console.log('✅ Page loaded');
    
    // Click export button
    const button = await page.$('button');
    console.log('✅ Export button found');
    
    // Set up download listener BEFORE clicking
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      button.click()
    ]);
    
    if (download) {
      console.log('✅ PDF download started!');
      const filename = download.suggestedFilename();
      console.log('Filename:', filename);
      // Save the download
      await download.saveAs('/tmp/test-export.pdf');
      console.log('✅ PDF saved to /tmp/test-export.pdf');
    } else {
      console.log('⚠️ No download detected');
    }
    
    // Wait a bit more
    await page.waitForTimeout(2000);
    
    // Check page content
    const errorEl = await page.$('#error');
    if (errorEl) {
      const display = await errorEl.evaluate(el => window.getComputedStyle(el).display);
      if (display !== 'none') {
        const errorText = await errorEl.textContent();
        console.log('❌ Error shown:', errorText);
      }
    }
    
    const statusEl = await page.$('#status');
    if (statusEl) {
      const statusText = await statusEl.textContent();
      console.log('📋 Status:', statusText);
    }
    
    await browser.close();
    console.log('Test complete');
  } catch (e) {
    console.log('❌ Test error:', e.message);
  }
})();
