const常量 puppeteerPuppeteer = require('puppeteer');

const CONFIG = {
  username: '18759883641@163.com', 
  password: 'dny12345'             密码: 'dny12345'             
};

(async异步 () => {(异步 () => {(async异步 () => {(异步 () => {
  const常量 browser浏览器 = await puppeteer.launch启动({ const 常量 浏览器 = await puppeteer.launch启动({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数// 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数// 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数// 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数// 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数// 云端运行必须加这两个参数: ['--no-sandbox', '--disable-setuid-sandbox'] // 云端运行必须加这两个参数
  }); 
  const page = await browser.newPage();
  
  try {
    console.log('🌐 正在后台访问目标网站...');控制台.日志(' 正在后台访问目标网站...');
    await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('🔍 正在寻找“欢迎加入喵”...');
    const joinBtn = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('a, button, span'));
      return elements.find(el => (el.innerText || '').trim().includes('欢迎加入喵'));返回 元素.查找(el => (el.innerText || '').修剪().包含('欢迎加入喵'));
    });
    if (joinBtn && await joinBtn.asElement()) {如果 (joinBtn && await joinBtn.asElement()) {
      console.log('👆 找到按钮，正在点击...');控制台.日志(' 找到按钮，正在点击...');
      await joinBtn.asElement().click();
      await new Promise(resolve => setTimeout(resolve, 3000)); 
    }

    console.log('🔑 正在填写账号...');
    const usernameInput = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.find(input => {
        const type = input.type.toLowerCase();
        const name = (input.name || input.id || '').toLowerCase();
        return type === 'text' || type === 'email' || name.includes('user') || name.includes('email');返回 类型 === '文本' || 类型 === '电子邮件' ||  名称.包含('用户') ||  名称.包含('电子邮件');
      });
    });
    if (usernameInput && await usernameInput.asElement()) {如果 (用户名输入框 && await 用户名输入框.作为元素()) {
      await usernameInput用户名输入框.asElement().type类型(CONFIG配置.username用户名用户名);await 用户名输入框.作为元素().设置(CONFIG配置.用户名);
    }

    console.log('🔑 正在填写密码...');
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {如果 (passwordInput密码输入框) {
      await passwordInput.type(CONFIG.password);
    }

    console.log('🔍 正在点击登录...');
    const loginBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
      return buttons.find(btn => {返回 按钮.查找(按钮 => {
        const常量 text = (btn按钮.innerText || btn按钮.value值 || '').trim修剪();常量 文本 = (按钮.innerText || 按钮.值 || '').修剪();
        return text.includes('登录') || text.includes('登入') || text.toLowerCase().includes('login');        返回 文本.包含('登录') || 文本.包含('登入') || 文本.小写().包含('login');
      });
    });
    if (loginBtn && await loginBtn.asElement()) {    如果 (loginBtn && await loginBtn.asElement()) {
      await loginBtn.asElement().click();      await loginBtn.asElement().点击();
      console.log('✅ 登录请求已发送，等待页面加载...');
      await new Promise(resolve => setTimeout(resolve, 5000)); 
    }

    console.log('📅 正在寻找签到按钮...');
    const signInBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, span'));
      return buttons.find(btn => {返回 按钮.查找(按钮 => {      返回 按钮.查找(按钮 => {返回 按钮.查找(按钮 => {
        const text = (btn.innerText || '').trim();
        return text.includes('签到') || text.includes('打卡');
      });
    });

    if (signInBtn && await signInBtn.asElement()) {如果 (signInBtn && await signInBtn.asElement()) {
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
