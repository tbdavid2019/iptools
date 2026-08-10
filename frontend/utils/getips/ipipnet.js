import { getIPFromUpai } from "./upai";
import { isValidIP } from '@/utils/valid-ip.js';

// 从 IPIP.net 获取 IP 地址
const getIPFromIPIP = async () => {
    try {
        const response = await fetch("https://myip.ipip.net/json");
        const data = await response.json();
        const ip = data.data.ip;
        const source = "IPIP.net";
        if (isValidIP(ip)) {
            return {
                ip: ip,
                source: source
            };
        } else {
            console.error("Invalid IP from IPIP.net:", ip);
        }
    } catch (error) {
        console.error("Error fetching IP from IPIP.net:", error);
    }
    // 故障时尝试从 AliCDN/Upai 获取 IP 地址
    try {
        const { ip, source } = await getIPFromUpai();
        if (isValidIP(ip)) {
            return { ip: ip, source: source };
        }
    } catch (e) {}

    // 終極備援：從 /api/ip 獲取
    try {
        const res = await fetch("/api/ip");
        const text = await res.text();
        const ip = text.trim();
        if (isValidIP(ip)) {
            return { ip, source: "IPIP.net" };
        }
    } catch (e) {}

    return { ip: null, source: "IPIP.net" };
};

export { getIPFromIPIP };