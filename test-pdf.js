const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  try {
    // 端口可能因冲突而变更为 3001，尝试 3000 -> 3001 两个端口
    const bases = ['http://localhost:3000', 'http://localhost:3001'];
    let navigated = false;
    for (const base of bases) {
      try {
        await page.goto(base + '/test-pdf', { waitUntil: 'networkidle' });
        navigated = true;
        break;
      } catch (e) {
        // 尝试下一个端口
      }
    }
    if (!navigated) {
      console.error('无法访问 /test-pdf，端口 3000/3001 不可用或页面加载失败');
      process.exit(5);
    }
    // Debug：记录当前页面 HTML 以帮助定位页面结构差异
    const fs = require('fs');
    const currentHtml = await page.content();
    fs.writeFileSync('debug-test-pdf.html', currentHtml);
    // 统一的、尽量简单的导出按钮定位：通过脚本直接点击文本中包含 "导出" 的按钮/链接
    const clicked = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a, input[type="button"]'));
      const target = candidates.find(el => (el.textContent || '').includes('导出') || (el.textContent || '').includes('📥 导出 PDF'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    if (!clicked) {
      // Debug：导出按钮未定位，记录完整 HTML 以便手动分析
      const outerHTML = await page.evaluate(() => document.documentElement.outerHTML);
      const fs = require('fs');
      fs.writeFileSync('debug-test-pdf-outer.html', outerHTML);
      console.error('导出 PDF 按钮未找到');
      process.exit(3);
    }
    // 等待导出完成（按要求 5 秒）
    await page.waitForTimeout(5000);
    // 截图保存为 pdf-test-result.png
    await page.screenshot({ path: 'pdf-test-result.png', fullPage: true });
    if (consoleErrors.length > 0) {
      require('fs').writeFileSync('pdf-test-errors.txt', consoleErrors.join('\n'));
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (e) {
    console.error('测试执行异常:', e);
    process.exit(4);
  } finally {
    await browser.close();
  }
})();
