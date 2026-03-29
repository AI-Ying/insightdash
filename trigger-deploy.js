const { chromium } = require('playwright-core');

(async () => {
  console.log('Opening Render dashboard...');
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to Render dashboard
    await page.goto('https://render.com', { timeout: 30000 });
    console.log('✅ Loaded render.com');
    
    // Try to click the deploy button
    const deployBtn = await page.$('button:has-text("Manual Deploy")');
    if (deployBtn) {
      console.log('Found Manual Deploy button');
      await deployBtn.click();
      console.log('Clicked Manual Deploy');
    } else {
      console.log('Manual Deploy button not found, might need login');
    }
    
    await page.waitForTimeout(3000);
    
    await browser.close();
    console.log('Done');
  } catch (e) {
    console.log('Error:', e.message);
  }
})();
