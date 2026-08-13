const https = require('https');

// 从环境变量获取 Cookie
const COOKIE = process.env.KLW_COOKIE;

if (!COOKIE) {
    console.log('❌ 错误：未找到 KLW_COOKIE 环境变量，请在 GitHub Secrets 中配置。');
    process.exit(1);
}

// 目标签到接口 URL (请根据实际情况修改，如果不确定可以先保留这个通用的)
// 注意：如果是 WordPress 站点，通常不需要特定的 API，访问首页或特定页面即可触发签到
const SIGN_IN_URL = 'https://klwllt.com/'; 

function doSignIn() {
    return new Promise((resolve, reject) => {
        const url = new URL(SIGN_IN_URL);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'GET', // 或者是 POST，取决于网站机制，通常 GET 访问即可触发
            headers: {
                'Cookie': COOKIE,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                // 简单的判断逻辑：如果返回了 200 且包含特定关键词（可选）
                if (res.statusCode === 200) {
                    console.log('✅ 签到请求发送成功！状态码: 200');
                    // 这里可以尝试解析 data 看看有没有 "签到成功" 字样，但通常只要请求发出就算成功
                    resolve('Success');
                } else {
                    console.log(`⚠️ 签到请求异常，状态码: ${res.statusCode}`);
                    resolve('Failed');
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求发生错误:', error);
            reject(error);
        });

        req.end();
    });
}

// 执行主函数
(async () => {
    console.log('🚀 开始执行签到任务...');
    try {
        await doSignIn();
        console.log('🏁 任务执行完毕。');
    } catch (err) {
        console.error('💥 任务执行出错:', err);
    }
})();
