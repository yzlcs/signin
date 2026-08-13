const puppeteer = require('puppeteer');

// 从环境变量读取配置
const CONFIG = {
  username: process.env.KLW_USERNAME || '18759883641@163.com', 
  password: process.env.KLW_PASSWORD || 'dny12345'             
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }); 
  const page = await browser.newPage();
  
  try {
    console.log('🌐 正在访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 1. 点击“欢迎加入喵”
    console.log('🔍 正在寻找并强制点击“欢迎加入喵”...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button, span'));
      const btn = elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 2. 点击顶部登录按钮
    console.log('🔑 正在强制点击顶部登录按钮...');
    await page.evaluate(() => {
      const btn = document.querySelector('a.inn-sign__login-btn');
      if (btn) btn.click();
    });

    // 3. 等待登录框
    console.log('⏳ 等待登录框加载...');
    await page.waitForSelector('input[name="pwd"]', { visible: true, timeout: 15000 });
    console.log('✅ 登录框已就绪');

    // 4. 填写账号
    console.log('🔑 正在填写账号...');
    await page.evaluate((username) => {
      const input = document.querySelector('input[name="email"]');
      if (input) {
        input.value = username;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, CONFIG.username);

    // 5. 填写密码
    console.log('🔑 正在填写密码...');
    await page.evaluate((password) => {
      const input = document.querySelector('input[name="pwd"]');
      if (input) {
        input.value = password;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, CONFIG.password);

    // 6. 提交登录
    console.log('🚀 正在尝试登录...');
    await page.keyboard.press('Enter');
    
    // 【关键修改】等待页面跳转或网络空闲，给服务器一点反应时间
    await new Promise(r => setTimeout(r, 3000));

    // 【关键修改】强制校验是否登录成功
    // 逻辑：如果页面上还能找到密码输入框，说明登录失败了（还在登录页）
    const isStillOnLogin = await page.$('input[name="pwd"]');
    if (isStillOnLogin) {
        console.error('❌ 登录失败！页面仍停留在登录状态。');
        console.error('可能原因：1. 账号密码错误 2. 触发了验证码拦截');
        process.exit(1); // 强制报错，让 Actions 变红
    }
    console.log('✅ 登录验证通过，已进入主页。');

    // 7. 签到
    console.log('📅 正在寻找签到按钮...');
    const signed = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a, span')).find(el => {
        const txt = el.innerText.trim();
        return txt.includes('签到') || txt.includes('打卡');
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (signed) console.log('🎉 签到成功！');
    else console.log('ℹ️ 未找到签到按钮，可能已签到。');

  } catch (error) {
    console.error('❌ 出错:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
