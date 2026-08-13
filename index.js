const puppeteer = require('puppeteer');

// 从环境变量读取配置，如果没有则使用默认值（方便本地调试）
const CONFIG = {
  username: process.env.KLW_USERNAME || '18759883641@163.com', 
  password: process.env.KLW_PASSWORD || 'dny12345'             
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: ture, // ✅ 改为有头模式，方便本地看界面调试
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }); 
  
  const page = await browser.newPage();
  
  // 设置视口大小，防止移动端布局导致元素找不到
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('🌐 正在访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // ---------------------------------------------------------
    // 1. 点击“欢迎加入喵”
    // ---------------------------------------------------------
    console.log('🔍 正在寻找并点击“欢迎加入喵”...');
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}), 
        page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('a, button, span'));
          const btn = elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
          if (btn) btn.click();
        })
      ]);
      console.log('✅ 点击完成，等待页面稳定...');
    } catch (e) {
      console.log('⚠️ “欢迎加入喵”点击超时或未找到，继续执行...');
    }
    
    await new Promise(r => setTimeout(r, 2000));

    // ---------------------------------------------------------
    // 2. 点击顶部登录按钮
    // ---------------------------------------------------------
    console.log('🔑 正在强制点击顶部登录按钮...');
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        page.evaluate(() => {
          const btn = document.querySelector('a.inn-sign__login-btn');
          if (btn) btn.click();
        })
      ]);
    } catch (e) {
      console.log('⚠️ 登录按钮点击未触发跳转，可能是弹窗模式，继续尝试填写...');
    }

    // ---------------------------------------------------------
    // 3. 等待登录框出现并填写信息
    // ---------------------------------------------------------
    console.log('⏳ 等待登录输入框加载...');
    await page.waitForSelector('input[name="pwd"]', { visible: true, timeout: 20000 });
    console.log('✅ 登录框已就绪');

    console.log('⌨️ 正在填写账号...');
    await page.type('input[name="email"]', CONFIG.username, { delay: 50 }); 

    console.log('⌨️ 正在填写密码...');
    await page.type('input[name="pwd"]', CONFIG.password, { delay: 50 });

    // ---------------------------------------------------------
    // 4. 提交登录
    // ---------------------------------------------------------
    console.log('🚀 正在提交登录...');
    
    const loginBtnClicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('登录'));
        if(btn) { btn.click(); return true; }
        return false;
    });

    if (!loginBtnClicked) {
        await page.keyboard.press('Enter');
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    
    const isStillLogin = await page.$('input[name="pwd"]');
    if (isStillLogin) {
      console.log('❌ 似乎仍在登录页，账号或密码可能错误，或者验证码拦截。');
    } else {
        console.log('✅ 登录状态检查通过');
    }

    // ---------------------------------------------------------
    // 5. 签到
    // ---------------------------------------------------------
    console.log('📅 正在寻找签到按钮...');
    const signed = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, span'));
      const btn = elements.find(el => {
        const txt = el.innerText.trim();
        return txt.includes('签到') || txt.includes('打卡');
      });
      
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (signed) {
        console.log('🎉 签到动作已执行！');
        await new Promise(r => setTimeout(r, 3000));
    } else {
        console.log('ℹ️ 未找到签到按钮，可能今天已经签到过了。');
    }

    console.log('🏁 任务全部完成。');

  } catch (error) {
    console.error('❌ 发生严重错误:', error.message);
    process.exit(1); 
  } finally {
    // 本地调试时，如果你想在最后多看几眼页面，可以加个延迟再关闭
    // await new Promise(r => setTimeout(r, 5000)); 
    await browser.close(); 
  }
})();
