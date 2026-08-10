import { isValidIP } from '@/utils/valid-ip.js';

// 从 IPify 获取 IPv4 地址
const getIPFromIpify_V4 = async () => {
    try {
        let response;
        try {
            response = await fetch("https://api4.ipify.org?format=json");
            if (!response.ok) throw new Error("api4 failed");
        } catch (e1) {
            try {
                response = await fetch("https://api.ipify.org?format=json");
                if (!response.ok) throw new Error("api failed");
            } catch (e2) {
                response = await fetch("/api/ip");
                const text = await response.text();
                const ip = text.trim();
                if (isValidIP(ip)) {
                    return { ip: ip, source: "IPify IPv4" };
                }
                throw new Error("fallback failed");
            }
        }

        const data = await response.json();
        const ip = data.ip;
        const source = "IPify IPv4";
        if (isValidIP(ip)) {
            return {
                ip: ip,
                source: source
            };
        }
    } catch (error) {
        console.error("Error fetching IPv4 address from ipify:", error);
    }
    return {
        ip: null,
        source: "IPify IPv4"
    };
};

export { getIPFromIpify_V4 };