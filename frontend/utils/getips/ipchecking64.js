import { isValidIP } from '@/utils/valid-ip.js';

// 从 8888IP 获取 IPv6/4 地址
const getIPFromIPChecking64 = async (originalSite) => {
    try {
        let ip;
        originalSite ? ip = await getFromJson() : ip = await getFromTrace();
        const source = "8888IP IPv6/4";
        if (isValidIP(ip)) {
            return {
                ip: ip,
                source: source
            };
        } else {
            console.error("Invalid IP from 8888IP IPv6/4:", ip);
            return {
                ip: null,
                source: source
            };
        }
    } catch (error) {
        console.error("Error fetching IP from 8888IP IPv6/4:", error);
        return {
            ip: null,
            source: "8888IP IPv6/4"
        };
    }
};

const getFromJson = async () => {
    try {
        const response = await fetch("https://64.ipcheck.ing");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();
        const ip = data.ip;
        return ip;
    } catch (error) {
        console.error("Error fetching IP from 8888IP IPv6 JSON:", error);
    }
    return getFromTrace();
};

const getFromTrace = async () => {
    try {
        const response = await fetch("https://64.ipcheck.ing/cdn-cgi/trace");
        const data = await response.text();
        const lines = data.split("\n");
        const ipLine = lines.find((line) => line.startsWith("ip="));
        let ip = "";
        if (ipLine) {
            ip = ipLine.split("=")[1];
        }
        return ip;
    } catch (error) {
        console.error("Error fetching IP from 8888IP IPv6 Trace:", error);
        throw error;
    }
};

export { getIPFromIPChecking64 };