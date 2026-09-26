const puppeteer = require('puppeteer');

// 从环境变量读取配置
const CONFIG = {
  username: process.env.KLW_USERNAME || '18759883641@163.com', 
  password: process.env.KLW_PASSWORD || 'dny12345'             
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", // ✅ 保持无头模式
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }); 
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 全局超时设置
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000); // ✅ 将默认超时延长到30秒，防止网络波动导致误报

  try {
    console.log('🌐 正在访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2' });
    
    // ---------------------------------------------------------
    // 1. 点击“欢迎加入喵” (保持原有逻辑，增加容错)
    // ---------------------------------------------------------
    try {
      console.log('🔍 寻找“欢迎加入喵”...');
      await page.waitForFunction(() => {
        const els = Array.from(document.querySelectorAll('a, button, span'));
        return els.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
      }, { timeout: 5000 }).catch(() => null);

      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, button, span'));
        const btn = els.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1000)); // 等待动画
    } catch (e) { console.log('⚠️ “欢迎加入喵”未找到，跳过。'); }

    // ---------------------------------------------------------
    // 2. 点击顶部登录按钮
    // ---------------------------------------------------------
    console.log('🔑 正在点击登录按钮...');
    try {
      // ✅ 关键：先确保登录按钮存在且可见
      await page.waitForSelector('a.inn-sign__login-btn', { visible: true, timeout: 10000 });
      
      // 点击并监听可能的跳转（如果是弹窗则不会跳转，catch住即可）
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}), 
        page.click('a.inn-sign__login-btn')
      ]);
      console.log('✅ 登录按钮已点击');
    } catch (e) {
      console.log('⚠️ 登录按钮点击失败，可能已处于登录状态或类名变更。');
    }

    // ---------------------------------------------------------
    // 3. 智能等待登录框出现 (核心修复部分)
    // ---------------------------------------------------------
    console.log('⏳ 正在等待登录弹窗加载...');
    
    let loginFrame = page; // 默认在主页面查找
    let isIframe = false;

    // ✅ 策略：轮询检测表单是否存在于 DOM 中（即使它是隐藏的或正在淡入）
    // 很多网站的 Dialog 是先 appendChild 到 body，然后再加 visible class
    try {
      await page.waitForFunction(() => {
        return document.querySelector('#inn-sign_dialog_fm') !== null;
      }, { timeout: 15000 }); // 给足15秒让JS渲染弹窗
      
      console.log('✅ 检测到登录表单容器 #inn-sign_dialog_fm');
    } catch (e) {
      // 如果主页面找不到，检查是否有 iframe
      console.log('⚠️ 主页面未找到表单，正在检查 iframe...');
      const frames = page.frames();
      for (const frame of frames) {
        if (frame !== page.mainFrame()) {
          try {
            await frame.waitForSelector('#inn-sign_dialog_fm', { timeout: 5000 });
            loginFrame = frame;
            isIframe = true;
            console.log('✅ 在 iframe 中找到登录表单！');
            break;
          } catch (err) { continue; }
        }
      }
      
      if (!isIframe) {
        throw new Error('❌ 登录表单加载超时：既不在主页面也不在 iframe 中。页面可能被拦截或结构已变。');
      }
    }

    // ✅ 现在 loginFrame 指向包含表单的页面对象（主页面或 iframe）
    // 等待具体的输入框变为“可交互”状态
    try {
      await loginFrame.waitForSelector('input[name="email"]', { visible: true, timeout: 10000 });
      await loginFrame.waitForSelector('input[name="pwd"]', { visible: true, timeout: 10000 });
      console.log('✅ 登录输入框已就绪');
    } catch (e) {
      throw new Error('❌ 登录框容器找到了，但输入框不可见（可能被遮挡或未渲染）。');
    }

    // ---------------------------------------------------------
    // 4. 填写并提交
    // ---------------------------------------------------------
    console.log('⌨️ 正在填写账号密码...');
    // ✅ 使用 click({ clickCount: 3 }) 先全选清空，防止浏览器自动填充干扰
    await loginFrame.click('input[name="email"]', { clickCount: 3 });
    await loginFrame.type('input[name="email"]', CONFIG.username, { delay: 50 });

    await loginFrame.click('input[name="pwd"]', { clickCount: 3 });
    await loginFrame.type('input[name="pwd"]', CONFIG.password, { delay: 50 });

    console.log('🚀 正在提交登录...');
    // 尝试点击登录按钮
    const loginBtnClicked = await loginFrame.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('登录'));
        if(btn) { btn.click(); return true; }
        return false;
    });

    if (!loginBtnClicked) {
        console.log('⚠️ 未找到登录按钮，尝试回车提交...');
        await loginFrame.keyboard.press('Enter');
    }

    // 等待登录后的反应
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000)); 
    
    // 验证登录结果
    const isStillLogin = await page.$('input[name="pwd"]'); // 如果还能找到密码框，说明没登录成功
    if (isStillLogin) {
      console.log('❌ 似乎仍在登录页，账号/密码错误或遇到验证码。');
    } else {
        console.log('✅ 登录状态检查通过');
    }

    // ---------------------------------------------------------
    // 5. 签到 (保持原有逻辑)
    // ---------------------------------------------------------
    console.log('📅 正在寻找签到按钮...');
    try {
      await page.waitForFunction(() => {
        const els = Array.from(document.querySelectorAll('button, a, span'));
        return els.find(el => {
            const txt = el.innerText.trim();
            return txt.includes('签到') || txt.includes('打卡');
        });
      }, { timeout: 10000 });

      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, a, span'));
        const btn = els.find(el => {
          const txt = el.innerText.trim();
          return txt.includes('签到') || txt.includes('打卡');
        });
        if (btn) btn.click();
      });
      console.log('🎉 签到动作已执行！');
    } catch (e) {
       console.log('ℹ️ 未找到签到按钮，可能已签到。');
    }

    console.log('🏁 任务全部完成。');

  } catch (error) {
    console.error('❌ 发生严重错误:', error.message);
  } finally {
    await browser.close(); 
  }
})();
