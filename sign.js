const puppeteer = require('puppeteer');

const CONFIG = {
  username: '18759883641@163.com', 
  password: 'dny12345'             
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数
  }); 
  const page = await browser.newPage();
  
  try {
    console.log('🌐 正在后台访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('🔍 正在寻找“欢迎加入喵”...');
    const joinBtn = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('a, button, span'));
      return elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
    });
    if (joinBtn && await joinBtn.asElement()) {
      console.log('👆 找到按钮，正在点击...');
      await joinBtn.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 3000)); 
    }

    console.log('🔑 正在填写账号...');
    const usernameInput = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.find(input => {
        const type = input.type.toLowerCase();
        const name = (input.name || input.id || '').toLowerCase();
        return type === 'text' || type === 'email' || name.includes('user') || name.includes('email');
      });
    });
    if (usernameInput && await usernameInput.asElement()) {
      await usernameInput.asElement().type(CONFIG.username);
    }

    console.log('🔑 正在填写密码...');
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type(CONFIG.password);
    }

    console.log('🔍 正在点击登录...');
    const loginBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
      return buttons.find(btn => {
        const text = (btn.innerText || btn.value || '').trim();
        return text.includes('登录') || text.includes('登入') || text.toLowerCase().includes('login');
      });
    });
    if (loginBtn && await loginBtn.asElement()) {
      await loginBtn.asElement().click();
      console.log('✅ 登录请求已发送，等待页面加载...');
      await new Promise(resolve => setTimeout(resolve, 5000)); 
    }

    console.log('📅 正在寻找签到按钮...');
    const signInBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, span'));
      return buttons.find(btn => {
        const text = (btn.innerText || '').trim();
        return text.includes('签到') || text.includes('打卡');
      });
    });

    if (signInBtn && await signInBtn.asElement()) {
      const btnText = await page.evaluate(btn => btn.innerText.trim(), signInBtn.asElement());
      if (btnText.includes('已签到') || btnText.includes('已打卡')) {
        console.log('⚠️ 提示：今日已经签到过了，无需重复操作。');
      } else {
        console.log('👆 找到签到按钮，正在点击...');
        await signInBtn.asElement().click();
        console.log('🎉 签到请求已发送！');
        await new Promise(resolve => setTimeout(resolve, 3000)); 
      }
    } else {
      console.log('⚠️ 没找到签到按钮，说明今日可能已经签到过了。');
    }
    console.log('🎊 整个自动化流程执行完毕！');

  } catch (error) {
    console.error('❌ 流程出错:', error.message);
  } finally {
    await browser.close(); 
  }
})();