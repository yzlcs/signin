const puppeteer = require('puppeteer');

// 从环境变量读取配置（在 GitHub Secrets 中配置）
const CONFIG = {
    username: process.env.KLW_USERNAME,
    password: process.env.KLW_PASSWORD
};

if (!CONFIG.username || !CONFIG.password) {
    console.error('❌ 错误：未配置 KLW_USERNAME 或 KLW_PASSWORD 环境变量！');
    process.exit(1);
}

(async () => {
    let browser;
    try {
        // ✅ 使用 "new" 模式，在 GitHub Linux 环境下更稳定
        browser = await puppeteer.launch({
            headless: "new", 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        page.setDefaultTimeout(30000); 

        // ---------------------------------------------------------
        // 1. 访问网页
        // ---------------------------------------------------------
        console.log('🌐 [1/6] 正在访问目标网站...');
        await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('✅ [1/6] 页面加载完成');

        // ---------------------------------------------------------
        // 2. 点击“欢迎加入喵”
        // ---------------------------------------------------------
        console.log('🔍 [2/6] 正在点击“欢迎加入喵”...');
        try {
            await page.click('text=欢迎加入喵', { timeout: 5000 });
            console.log('✅ [2/6] 点击“欢迎加入喵”成功');
            await new Promise(r => setTimeout(r, 2000)); // 等待页面响应
        } catch (e) {
            console.log('⚠️ [2/6] 未找到“欢迎加入喵”按钮，继续执行...');
        }

        // ---------------------------------------------------------
        // 3. 点击“登录”
        // ---------------------------------------------------------
        console.log('🔑 [3/6] 正在点击“登录”按钮...');
        try {
            await page.click('text=登录', { timeout: 5000 });
            console.log('✅ [3/6] 点击“登录”成功');
            await new Promise(r => setTimeout(r, 3000)); // 等待登录弹窗或页面加载
        } catch (e) {
            console.log('❌ [3/6] 未找到“登录”按钮');
        }

        // ---------------------------------------------------------
        // 4. 输入账号
        // ---------------------------------------------------------
        console.log('⌨️ [4/6] 正在输入账号...');
        // 优先找 name=email，找不到找 type=email，再找不到找第一个可见的文本框
        const accountSelectors = ['input[name="email"]', 'input[name="username"]', 'input[type="email"]', 'input[type="text"]'];
        let accountFilled = false;
        for (const selector of accountSelectors) {
            try {
                await page.waitForSelector(selector, { visible: true, timeout: 3000 });
                await page.type(selector, CONFIG.username, { delay: 50 });
                accountFilled = true;
                console.log(`✅ [4/6] 账号输入成功 (${selector})`);
                break;
            } catch (e) {}
        }
        if (!accountFilled) {
            console.log('⚠️ [4/6] 常规账号输入框未找到，尝试兜底填写...');
            await page.evaluate((user) => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const target = inputs.find(i => i.type !== 'password' && i.type !== 'hidden' && i.offsetParent !== null);
                if (target) { target.value = user; target.dispatchEvent(new Event('input', { bubbles: true })); }
            }, CONFIG.username);
        }

        // ---------------------------------------------------------
        // 5. 输入密码
        // ---------------------------------------------------------
        console.log('🔒 [5/6] 正在输入密码...');
        const pwdSelectors = ['input[name="pwd"]', 'input[name="password"]', 'input[type="password"]'];
        let pwdFilled = false;
        for (const selector of pwdSelectors) {
            try {
                await page.waitForSelector(selector, { visible: true, timeout: 3000 });
                await page.type(selector, CONFIG.password, { delay: 50 });
                pwdFilled = true;
                console.log(`✅ [5/6] 密码输入成功 (${selector})`);
                break
