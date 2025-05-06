import { get } from 'https';
import { isValidIP } from '../common/valid-ip.js';
import { refererCheck } from '../common/referer-check.js';

export default (req, res) => {
    console.log('ipapi-is.js: 處理請求開始');
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

    console.log('IPAPIIS_API_KEY 環境變數值:', process.env.IPAPIIS_API_KEY);
    const keys = (process.env.IPAPIIS_API_KEY || '').split(',');
    const key = keys[Math.floor(Math.random() * keys.length)];
    console.log('使用的 IPAPIIS key:', key);
    
    const url_hasKey = `https://api.ipapi.is?q=${ipAddress}&key=${key}`;
    const url_noKey = `https://api.ipapi.is?q=${ipAddress}`;
    const url = key ? url_hasKey : url_noKey;
    console.log('IPAPIIS 請求 URL:', url);

    console.log('準備向 IPAPIIS 發送請求...');
    get(url, apiRes => {
        console.log('已連接到 IPAPIIS API 服務器');
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            try {
                console.log('IPAPIIS API 回應狀態碼:', apiRes.statusCode);
                console.log('IPAPIIS API 回應原始數據:', data);
                
                const originalJson = JSON.parse(data);
                console.log('IPAPIIS API 解析後的 JSON:', JSON.stringify(originalJson, null, 2));
                
                const modifiedJson = modifyJsonForIPAPI(originalJson);
                console.log('IPAPIIS 修改後的 JSON:', JSON.stringify(modifiedJson, null, 2));
                
                res.json(modifiedJson);
            } catch (e) {
                console.error('IPAPIIS API 處理錯誤:', e);
                res.status(500).json({ error: 'Error parsing JSON' });
            }
        });
    }).on('error', (e) => {
        console.error('IPAPIIS API 請求錯誤:', e);
        res.status(500).json({ error: e.message });
    });
};

function modifyJsonForIPAPI(json) {
    let asn = json.asn || {};
    const location = json.location || {};
    const ip = json.ip || 'N/A';
    const is_datacenter = json.is_datacenter || false;
    const is_proxy = json.is_proxy || false;
    const is_vpn = json.is_vpn || false;
    const is_tor = json.is_tor || false;

    return {
        ip: ip,
        city: location.city || 'N/A',
        region: location.state || 'N/A',
        country: location.country_code || 'N/A',
        country_name: location.country || 'N/A',
        country_code: location.country_code || 'N/A',
        latitude: location.latitude || 'N/A',
        longitude: location.longitude || 'N/A',
        asn: asn.asn === undefined ? 'N/A' : 'AS' + asn.asn,
        org: asn.org || 'N/A',
        isHosting: is_datacenter || false,
        isProxy: is_proxy || is_vpn || is_tor || false
    };
}
