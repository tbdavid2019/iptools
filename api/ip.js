import { isIP } from 'node:net';

const getHeader = (headers, name) => {
    const value = headers?.[name];
    return Array.isArray(value) ? value[0] : value;
};

const normalizeIp = (value) => {
    if (!value) return null;

    const candidate = String(value).trim().replace(/^"|"$/g, '');
    if (isIP(candidate)) return candidate;

    // Handle an IPv4 address that includes a proxy port.
    const ipv4WithPort = candidate.match(/^(.+):(\d{1,5})$/);
    if (ipv4WithPort && isIP(ipv4WithPort[1]) === 4) {
        return ipv4WithPort[1];
    }

    // Handle the [IPv6]:port notation used by some proxies.
    const ipv6WithPort = candidate.match(/^\[([^\]]+)\]:\d{1,5}$/);
    if (ipv6WithPort && isIP(ipv6WithPort[1]) === 6) {
        return ipv6WithPort[1];
    }

    return null;
};

const getClientIp = (req) => {
    const headers = req.headers || {};
    const forwardedFor = getHeader(headers, 'x-forwarded-for');

    // Prefer headers supplied by the edge proxy, then fall back to the
    // standard forwarded chain and the direct socket address.
    const candidates = [
        getHeader(headers, 'cf-connecting-ip'),
        getHeader(headers, 'x-real-ip'),
        getHeader(headers, 'x-vercel-forwarded-for'),
        ...(forwardedFor ? String(forwardedFor).split(',') : []),
        req.socket?.remoteAddress,
    ];

    for (const candidate of candidates) {
        const ip = normalizeIp(candidate);
        if (ip) return ip;
    }

    return 'unknown';
};

export default function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return res.status(405).send('Method Not Allowed\n');
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(`${getClientIp(req)}\n`);
}
