import dotenv from 'dotenv';
dotenv.config();

function refererCheck(referer) {
    console.log('檢查 referer:', referer);
    const allowedDomains = ['localhost', ...(process.env.ALLOWED_DOMAINS || '').split(',').filter(Boolean)];
    console.log('允許的域名:', allowedDomains);

    if (referer) {
        try {
            const domain = new URL(referer).hostname;
            console.log('referer 域名:', domain);
            const isAllowed = allowedDomains.includes(domain);
            console.log('referer 是否允許:', isAllowed);
            return isAllowed;
        } catch (error) {
            console.error('解析 referer 時出錯:', error);
            return false;
        }
    }
    console.log('沒有提供 referer');
    return true;  // 修改為 true，允許沒有 referer 的請求
}

export { refererCheck };
