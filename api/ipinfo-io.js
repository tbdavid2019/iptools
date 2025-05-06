import { get } from 'https';
import { isValidIP } from '../common/valid-ip.js';
import { refererCheck } from '../common/referer-check.js';
import countryLookup from 'country-code-lookup';

export default async (req, res) => {
    console.log('ipinfo-io.js: 處理請求開始');
    // 限制只能从指定域名访问
    const referer = req.headers.referer;
    if (!refererCheck(referer)) {
        return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    }

    // 从请求中获取 IP 地址
    const ipAddress = req.query.ip;
    if (!ipAddress) {
        return res.status(400).json({ error: 'No IP address provided' });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(ipAddress)) {
        return res.status(400).json({ error: 'Invalid IP address' });
    }

    // 构建请求 ipinfo.io 的 URL
    console.log('IPINFO_API_TOKEN 環境變數值:', process.env.IPINFO_API_TOKEN);
    const tokens = (process.env.IPINFO_API_TOKEN || '').split(',');
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    console.log('使用的 IPINFO token:', token);

    const url_hasToken = `https://ipinfo.io/${ipAddress}?token=${token}`;
    const url_noToken = `https://ipinfo.io/${ipAddress}`;
    const url = token ? url_hasToken : url_noToken;
    console.log('IPINFO 請求 URL:', url);

    console.log('準備向 IPINFO 發送請求...');
    get(url, apiRes => {
        console.log('已連接到 IPINFO API 服務器');
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', async () => {
            try {
                console.log('IPINFO API 回應狀態碼:', apiRes.statusCode);
                console.log('IPINFO API 回應原始數據:', data);
                
                const originalJson = JSON.parse(data);
                console.log('IPINFO API 解析後的 JSON:', JSON.stringify(originalJson, null, 2));
                
                const modifiedJson = modifyJson(originalJson);
                console.log('IPINFO 修改後的 JSON:', JSON.stringify(modifiedJson, null, 2));

                res.json(modifiedJson);
            } catch (e) {
                console.error('IPINFO API 處理錯誤:', e);
                res.status(500).json({ error: 'Error parsing JSON' });
            }
        });
    }).on('error', (e) => {
        console.error('IPINFO API 請求錯誤:', e);
        res.status(500).json({ error: e.message });
    });
};

function modifyJson(json) {
    // 提供預設值以防 API 回傳的 JSON 缺少某些屬性
    const ip = json.ip || 'N/A';
    const city = json.city || 'N/A';
    const region = json.region || 'N/A';
    const country = json.country || 'N/A';
    const loc = json.loc || '0,0';
    const org = json.org || 'AS0 Unknown';

    let countryName = 'Unknown Country';
    try {
        if (country && country !== 'N/A') {
            const lookup = countryLookup.byIso(country);
            if (lookup) {
                countryName = lookup.country || 'Unknown Country';
            }
        }
    } catch (e) {
        console.error('Error looking up country:', e);
    }

    let latitude = 0, longitude = 0;
    try {
        if (loc && loc !== '0,0') {
            [latitude, longitude] = loc.split(',').map(Number);
        }
    } catch (e) {
        console.error('Error parsing location:', e);
    }

    let asn = 'AS0', modifiedOrg = 'Unknown';
    try {
        if (org && org !== 'AS0 Unknown') {
            const parts = org.split(' ');
            asn = parts[0] || 'AS0';
            modifiedOrg = parts.slice(1).join(' ') || 'Unknown';
        }
    } catch (e) {
        console.error('Error parsing organization:', e);
    }

    return {
        ip,
        city,
        region,
        country,
        country_name: countryName,
        country_code: country,
        latitude,
        longitude,
        asn,
        org: modifiedOrg
    };
}
