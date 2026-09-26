const puppeteer = require('puppeteer');

// 从环境变量读取配置（强烈建议在 GitHub Secrets 中配置）
const CONFIG = {
    username: process.env.KLW_USERNAME,
    password: process.env.KLW_PASSWORD
};

// 检查必要的环境变量
if (!CONFIG.username || !CONFIG.password) {
    console.error('❌ 错误：未配置 KLW_USERNAME 或 KLW_PASSWORD 环境变量！');
    console.error('💡 提示：请在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加这两个密钥。');
    process.exit(1);
}

(async () => {
    let browser;
    try {
        // ✅ 使用 "new" 模式，在 GitHub Linux 环境下更稳定
        browser = await puppeteer.launch({
            headless: "new", 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu' // GitHub Actions 无 GPU，建议禁用
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        page.setDefaultTimeout(30000); 

        console.log('🌐 [1/5] 正在访问目标网站...');
        await page.goto('https://klwllt.com', { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('✅ [1/5] 页面加载完成');

        // ---------------------------------------------------------
        // 1. 点击“欢迎加入喵”
        // ---------------------------------------------------------
        console.log('🔍 [2/5] 正在寻找并点击“欢迎加入喵”...');
        try {
            await page.evaluate(() => {
                let btn = Array.from(document.querySelectorAll('a, button')).find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
                if (btn) { btn.click(); return; }
                const span = Array.from(document.querySelectorAll('span')).find(el => (el.innerText || '').trim().includes('欢迎加入喵'));
                if (span) {
                    let parent = span.parentElement;
                    while (parent && parent !== document.body) {
                        if (['A', 'BUTTON'].includes(parent.tagName)) { parent.click(); return; }
                        parent = parent.parentElement;
                    }
                    span.click();
                }
            });
            await new Promise(r => setTimeout(r, 2000));
            console.log('✅ [2/5] 点击操作已执行');
        } catch (e) {
            console.log('⚠️ [2/5] 点击异常:', e.message);
        }

        // ---------------------------------------------------------
        // 2. 点击登录按钮
        // ---------------------------------------------------------
        console.log('🔑 [3/5] 正在点击登录按钮...');
        try {
            const btn = await page.$('a.inn-sign__login-btn');
            if (btn) {
                await btn.click();
            } else {
                const textBtn = await page.$('text=登录');
                if (textBtn) {
                    await textBtn.click();
                } else {
                    await page.evaluate(() => {
                        const b = Array.from(document.querySelectorAll('a, button')).find(el => (el.innerText || '').trim() === '登录');
                        if (b) b.click();
                    });
                }
            }
            console.log('✅ [3/5] 登录按钮点击指令已发送');
        } catch (e) {
            console.log('⚠️ [3/5] 登录按钮点击异常:', e.message);
        }
        
        // 等待弹窗动画或页面跳转
        await new Promise(r => setTimeout(r, 3000));

        // ---------------------------------------------------------
        // 3. 定位并填写表单
        // ---------------------------------------------------------
        console.log('⏳ [4/5] 正在定位并填写账号密码...');
        let pwdTarget = null;

        // 尝试在主页面查找
        try {
            await page.waitForSelector('input[name="pwd"]', { visible: true, timeout: 5000 });
            pwdTarget = page;
        } catch (e) {
            // 检查 iframe
            const frames = page.frames();
            for (const frame of frames) {
                if (frame === page.mainFrame()) continue;
                try {
                    await frame.waitForSelector('input[name="pwd"]', { visible: true, timeout: 5000 });
                    pwdTarget = frame;
                    break;
                } catch (err) {}
            }
        }

        // visible 失败后尝试 attached 模式
        if (!pwdTarget) {
            try {
                await page.waitForSelector('input[name="pwd"]', { timeout: 5000 });
                pwdTarget = page;
            } catch (e) {
                const frames = page.frames();
                for (const frame of frames) {
                    if (frame === page.mainFrame()) continue;
                    try {
                        await frame.waitForSelector('input[name="pwd"]', { timeout: 5000 });
                        pwdTarget = frame;
                        break;
                    } catch (err) {}
                }
            }
        }

        if (!pwdTarget) throw new Error('无法定位密码输入框，请检查网站结构是否发生变化');

        // 填写账号
        const emailSelectors = ['input[name="email"]', 'input[name="username"]', 'input[type="email"]'];
        let emailFilled = false;
        for (const selector of emailSelectors) {
            try {
                await pwdTarget.waitForSelector(selector, { timeout: 3000 });
                await pwdTarget.type(selector, CONFIG.username, { delay: 50 });
                emailFilled = true;
                break;
            } catch (e) {}
        }
        if (!emailFilled) {
            await pwdTarget.evaluate((user) => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const target = inputs.find(i => i.type !== 'password' && i.type !== 'hidden' && i.name !== 'pwd');
                if (target) { target.value = user; target.dispatchEvent(new Event('input', { bubbles: true })); }
            }, CONFIG.username);
        }

        // 填写密码
        const pwdSelectors = ['input[name="pwd"]', 'input[name="password"]', 'input[type="password"]'];
        for (const selector of pwdSelectors) {
            try {
                await pwdTarget.waitForSelector(selector, { timeout: 3000 });
                await pwdTarget.type(selector, CONFIG.password, { delay: 50 });
                break;
            } catch (e) {}
        }
        console.log('✅ [4/5] 账号密码填写完成');

        // ---------------------------------------------------------
        // 4. 提交登录
        // ---------------------------------------------------------
        const loginBtnClicked = await pwdTarget.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('登录'));
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!loginBtnClicked) await pwdTarget.keyboard.press('Enter');

        // 等待登录结果
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
            new Promise(r => setTimeout(r, 10000))
        ]);
        await new Promise(r => setTimeout(r, 2000));

        // 检查登录状态
        const isStillLogin = await page.$('input[name="pwd"]');
        if (isStillLogin) {
            console.log('❌ [4/5] 登录失败：仍在登录页，请检查账号密码或验证码。');
            process.exit(1);
        } else {
            console.log('✅ [4/5] 登录成功');
        }

        // ---------------------------------------------------------
        // 5. 签到
        // ---------------------------------------------------------
        console.log('📅 [5/5] 正在执行签到...');
        const signed = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, a'));
            const btn = elements.find(el => {
                const txt = el.innerText.trim();
                return txt.includes('签到') || txt.includes('打卡');
            });
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (signed) {
            console.log('✅ [5/5] 签到成功！');
        } else {
            console.log('ℹ️ [5/5] 未找到签到按钮（可能今日已签到）');
        }

        console.log('🎉 任务全部顺利完成！');

    } catch (error) {
        console.error(`❌ 任务异常终止: ${error.message}`);
        process.exit(1);
    } finally {
        // ✅ 确保浏览器在任务结束后关闭，防止 GitHub Actions 挂起
        if (browser) await browser.close();
    }
})();
