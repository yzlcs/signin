const puppeteer = require('puppeteer');

// 从环境变量读取配置，如果没有则使用默认值
const CONFIG = {
  username: process.env.KLW_USERNAME || '18759883641@163.com', 
  password: process.env.KLW_PASSWORD || 'dny12345'             
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new", // ✅ 使用新版无头模式，兼容性更好且更难被检测
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }); 
  
  const page = await browser.newPage();
  
  // 设置视口大小
  await page.setViewport({ width: 1280, height: 800 });

  // ✅ 全局超时设置：防止某个步骤卡死整个脚本
  page.setDefaultNavigationTimeout(60000); // 页面跳转超时 60s
  page.setDefaultTimeout(20000);           // 元素查找超时 20s

  try {
    console.log('🌐 正在访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2' });
    
    // ---------------------------------------------------------
    // 辅助函数：安全点击（先等待元素可见，再点击）
    // ---------------------------------------------------------
    const safeClick = async (selectorOrFn, description) => {
      console.log(`🔍 正在寻找并点击：${description}...`);
      try {
        if (typeof selectorOrFn === 'string') {
          // 如果是 CSS 选择器
          await page.waitForSelector(selectorOrFn, { visible: true });
          await page.click(selectorOrFn);
        } else {
          // 如果是自定义查找逻辑 (evaluate)
          // 注意：evaluate 内部无法直接 waitForSelector，这里主要处理点击动作
          // 对于复杂的查找，我们通常先 waitForSelector 一个父级，或者依赖 evaluate 返回结果
          // 这里为了保持你原有的逻辑，我们假设 evaluate 能找到，找不到会报错进入 catch
          await page.evaluate(selectorOrFn);
        }
        console.log(`✅ 点击成功：${description}`);
        return true;
      } catch (e) {
        console.log(`⚠️ 未找到或无法点击：${description} (${e.message})`);
        return false;
      }
    };

    // ---------------------------------------------------------
    // 1. 点击“欢迎加入喵”
    // ---------------------------------------------------------
    // 由于这个按钮可能是动态生成的，我们先尝试等待一下包含该文字的通用选择器
    // 如果页面结构复杂，直接 evaluate 查找也是一种策略，但最好配合 waitForFunction
    try {
      console.log('🔍 正在寻找“欢迎加入喵”...');
      await page.waitForFunction(() => {
        const elements = Array.from(document.querySelectorAll('a, button, span'));
        return elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
      }, { timeout: 5000 }).catch(() => null); // 等待5秒，没找到也不报错

      await safeClick(() => {
        const elements = Array.from(document.querySelectorAll('a, button, span'));
        const btn = elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
        if (btn) btn.click();
      }, "欢迎加入喵");
      
      // 点击后给一点缓冲时间让动画播放
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log('⚠️ “欢迎加入喵”处理流程异常，继续执行...');
    }

    // ---------------------------------------------------------
    // 2. 点击顶部登录按钮
    // ---------------------------------------------------------
    console.log('🔑 正在强制点击顶部登录按钮...');
    try {
      // ✅ 关键修改：先等待登录按钮出现在页面上
      await page.waitForSelector('a.inn-sign__login-btn', { visible: true, timeout: 10000 });
      
      // 使用 Promise.all 监听点击后是否发生跳转（如果是弹窗则不会跳转，catch 住即可）
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}), 
        page.click('a.inn-sign__login-btn')
      ]);
      console.log('✅ 登录按钮已点击');
    } catch (e) {
      console.log('⚠️ 登录按钮点击失败，可能是类名变更或已登录状态。');
    }

    // ---------------------------------------------------------
    // 3. 等待登录框出现并填写信息
    // ---------------------------------------------------------
    console.log('⏳ 等待登录输入框加载...');
    
    // ✅ 关键修改：严格等待密码框出现，这通常意味着表单已渲染完毕
    try {
      await page.waitForSelector('input[name="pwd"]', { visible: true });
      
      // 既然密码框出来了，邮箱框通常也在，再次确认一下更稳妥
      await page.waitForSelector('input[name="email"]', { visible: true });
      console.log('✅ 登录框已就绪');

      console.log('⌨️ 正在填写账号...');
      // type 之前不需要额外 wait，因为上面已经 wait 过了，但清空一下输入框是个好习惯
      await page.click('input[name="email"]', { clickCount: 3 }); // 全选
      await page.type('input[name="email"]', CONFIG.username, { delay: 30 }); 

      console.log('⌨️ 正在填写密码...');
      await page.click('input[name="pwd"]', { clickCount: 3 }); // 全选
      await page.type('input[name="pwd"]', CONFIG.password, { delay: 30 });
      
    } catch (e) {
      throw new Error('❌ 登录表单加载超时，页面可能被拦截或未正确弹出登录框。');
    }

    // ---------------------------------------------------------
    // 4. 提交登录
    // ---------------------------------------------------------
    console.log('🚀 正在提交登录...');
    
    // ✅ 关键修改：等待登录按钮可点击
    // 这里的登录按钮没有明确的 ID，我们通过文本查找，但要先确保它在 DOM 里
    // 我们可以先等待表单容器存在
    await page.waitForSelector('#inn-sign_dialog_fm', { visible: true });

    const loginBtnClicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('登录'));
        if(btn) { btn.click(); return true; }
        return false;
    });

    if (!loginBtnClicked) {
        console.log('⚠️ 未找到登录按钮，尝试回车提交...');
        await page.keyboard.press('Enter');
    }

    // 等待登录后的反应（跳转或刷新）
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000)); // 额外缓冲
    
    // 验证登录结果
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
    // ✅ 关键修改：等待包含“签到”文字的元素出现
    try {
      await page.waitForFunction(() => {
        const elements = Array.from(document.querySelectorAll('button, a, span'));
        return elements.find(el => {
            const txt = el.innerText.trim();
            return txt.includes('签到') || txt.includes('打卡');
        });
      }, { timeout: 10000 });

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
          console.log('ℹ️ 代码找到了元素但点击逻辑返回 false (极少见)，或元素不可见。');
      }
    } catch (e) {
       console.log('ℹ️ 未找到签到按钮（超时），可能今天已经签到过了或按钮未加载。');
    }

    console.log('🏁 任务全部完成。');

  } catch (error) {
    console.error('❌ 发生严重错误:', error.message);
    // process.exit(1); // 调试时可以注释掉这行，防止浏览器瞬间关闭看不到日志
  } finally {
    await browser.close(); 
  }
})();
