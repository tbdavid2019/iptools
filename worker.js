import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import { handleMcpRequest, MCP_SERVER_INFO, MCP_TOOLS } from './common/mcp.js';
const assetManifest = JSON.parse(manifestJSON);

// DoH Servers for DNS Resolver
const DOH_SERVERS = {
    'Google': 'https://dns.google/resolve?',
    'Cloudflare': 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&',
    'AdGuard': 'https://dns.adguard.com/resolve?',
    'AliDNS': 'https://dns.alidns.com/resolve?',
};

async function resolveDoh(hostname, type, name, url) {
    try {
        const res = await fetch(`${url}name=${encodeURIComponent(hostname)}&type=${type}`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const data = await res.json();
        const addresses = data.Answer ? data.Answer.map(ans => ans.data) : ['N/A'];
        return { [name]: addresses.length ? addresses : 'N/A' };
    } catch (e) {
        return { [name]: 'N/A' };
    }
}

export default {
    async fetch(request, env, ctx) {
        const response = await this.handleRequest(request, env, ctx);
        const headers = new Headers(response.headers);
        if (!headers.has('X-Content-Type-Options')) headers.set('X-Content-Type-Options', 'nosniff');
        if (!headers.has('X-Frame-Options')) headers.set('X-Frame-Options', 'SAMEORIGIN');
        if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    },

    async handleRequest(request, env, ctx) {
        const url = new URL(request.url);
        const rawPath = url.pathname;
        const pathname = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
        const userAgent = request.headers.get('user-agent') || '';
        const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

        // 1. Command-line curl/wget query on root /
        if (pathname === '/' && /^(curl|wget)/i.test(userAgent)) {
            return new Response(`${clientIp}\n`, {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }

        // Handle llms.txt & llms-full.txt with UTF-8 charset
        if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
            try {
                const assetResponse = await getAssetFromKV(
                    {
                        request,
                        waitUntil: ctx.waitUntil.bind(ctx),
                    },
                    {
                        ASSET_NAMESPACE: env.__STATIC_CONTENT,
                        ASSET_MANIFEST: assetManifest,
                        mapRequestUrl: req => new Request(req.url, req),
                    }
                );
                const headers = new Headers(assetResponse.headers);
                headers.set('content-type', 'text/markdown; charset=utf-8');
                headers.set('Link', '</llms.txt>; rel="llms-txt"; type="text/markdown"');
                return new Response(assetResponse.body, {
                    status: assetResponse.status,
                    headers
                });
            } catch (e) {
                return new Response(`Error fetching ${pathname}: ${e.message}`, { status: 404 });
            }
        }

        // MCP & WebMCP endpoint (/mcp & /api/mcp)
        if (pathname === '/mcp' || pathname === '/api/mcp') {
            const corsHeaders = {
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, POST, OPTIONS',
                'access-control-allow-headers': 'Content-Type, Authorization, Accept',
            };

            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: corsHeaders
                });
            }

            if (request.method === 'GET') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    protocol: 'Model Context Protocol (JSON-RPC 2.0)',
                    server: MCP_SERVER_INFO,
                    endpoint: '/mcp',
                    usage: 'Send POST requests with JSON-RPC 2.0 payload (e.g. tools/list or tools/call)',
                    tools: MCP_TOOLS
                }, null, 2), {
                    headers: {
                        ...corsHeaders,
                        'content-type': 'application/json; charset=utf-8',
                        'cache-control': 'no-store'
                    }
                });
            }

            let body = null;
            try {
                body = await request.json();
            } catch (e) {
                return new Response(JSON.stringify({
                    jsonrpc: '2.0',
                    id: null,
                    error: { code: -32700, message: 'Parse error: Invalid JSON payload' }
                }), {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        'content-type': 'application/json; charset=utf-8'
                    }
                });
            }

            const context = {
                clientIp,
                userAgent,
                env,
                country: request.headers.get('cf-ipcountry') || 'unknown',
                city: request.headers.get('cf-ipcity') || 'unknown'
            };

            const result = await handleMcpRequest(body, context);
            return new Response(JSON.stringify(result), {
                headers: {
                    ...corsHeaders,
                    'content-type': 'application/json; charset=utf-8'
                }
            });
        }

        // 2. /api/ip
        if (pathname === '/api/ip') {
            return new Response(`${clientIp}\n`, {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }

        // 3. /api/configs
        if (pathname === '/api/configs') {
            const envConfigs = {
                map: env.GOOGLE_MAP_API_KEY,
                ipInfo: env.IPINFO_API_TOKEN,
                ipChecking: env.IPCHECKING_API_KEY,
                ip2location: env.IP2LOCATION_API_KEY,
                originalSite: true,
                cloudFlare: env.CLOUDFLARE_API,
                ipapiis: env.IPAPIIS_API_KEY,
            };
            const result = {};
            for (const key in envConfigs) {
                result[key] = !!envConfigs[key];
            }
            return new Response(JSON.stringify(result), {
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }

        // 4. /api/ipinfo
        if (pathname === '/api/ipinfo') {
            const ip = url.searchParams.get('ip') || clientIp;
            const tokens = (env.IPINFO_API_TOKEN || '').split(',').filter(Boolean);
            const token = tokens.length ? tokens[Math.floor(Math.random() * tokens.length)] : '';
            const apiUrl = token ? `https://ipinfo.io/${ip}?token=${token}` : `https://ipinfo.io/${ip}`;

            try {
                const res = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
                });
                const json = await res.json();
                const [lat, lon] = (json.loc || '0,0').split(',').map(Number);
                const orgParts = (json.org || 'AS0 Unknown').split(' ');
                const asn = orgParts[0] || 'AS0';
                const org = orgParts.slice(1).join(' ') || 'Unknown';

                return new Response(JSON.stringify({
                    ip: json.ip || ip,
                    city: json.city || 'N/A',
                    region: json.region || 'N/A',
                    country: json.country || 'N/A',
                    country_name: json.country || 'N/A',
                    country_code: json.country || 'N/A',
                    latitude: lat || 0,
                    longitude: lon || 0,
                    asn,
                    org
                }), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 5. /api/ipapicom
        if (pathname === '/api/ipapicom') {
            const ip = url.searchParams.get('ip') || clientIp;
            const lang = url.searchParams.get('lang') || 'en';
            const apiUrl = `http://ip-api.com/json/${ip}?fields=66842623&lang=${lang}`;

            try {
                const res = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
                });
                const json = await res.json();
                const asn = json.as ? json.as.split(' ')[0] : '';
                return new Response(JSON.stringify({
                    ip: json.query || ip,
                    city: json.city || 'N/A',
                    region: json.regionName || 'N/A',
                    country: json.countryCode || 'N/A',
                    country_name: json.country || 'N/A',
                    country_code: json.countryCode || 'N/A',
                    latitude: json.lat || 0,
                    longitude: json.lon || 0,
                    asn,
                    org: json.isp || 'N/A'
                }), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 6. /api/ipapiis
        if (pathname === '/api/ipapiis') {
            const ip = url.searchParams.get('ip') || clientIp;
            const keys = (env.IPAPIIS_API_KEY || '').split(',').filter(Boolean);
            const key = keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
            const apiUrl = key ? `https://api.ipapi.is?q=${ip}&key=${key}` : `https://api.ipapi.is?q=${ip}`;

            try {
                const res = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
                });
                const json = await res.json();
                const asn = json.asn || {};
                const location = json.location || {};
                return new Response(JSON.stringify({
                    ip: json.ip || ip,
                    city: location.city || 'N/A',
                    region: location.state || 'N/A',
                    country: location.country_code || 'N/A',
                    country_name: location.country || 'N/A',
                    country_code: location.country_code || 'N/A',
                    latitude: location.latitude || 0,
                    longitude: location.longitude || 0,
                    asn: asn.asn === undefined ? 'N/A' : 'AS' + asn.asn,
                    org: asn.org || 'N/A',
                    isHosting: json.is_datacenter || false,
                    isProxy: json.is_proxy || json.is_vpn || json.is_tor || false
                }), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // /api/maxmind
        if (pathname === '/api/maxmind') {
            const ip = url.searchParams.get('ip') || clientIp;
            const lang = url.searchParams.get('lang') || 'en';
            const apiUrl = `http://ip-api.com/json/${ip}?fields=66842623&lang=${lang}`;

            try {
                const res = await fetch(apiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
                });
                const json = await res.json();
                const asn = json.as ? json.as.split(' ')[0] : 'N/A';
                return new Response(JSON.stringify({
                    ip: json.query || ip,
                    city: json.city || 'N/A',
                    region: json.regionName || 'N/A',
                    country: json.countryCode || 'N/A',
                    country_name: json.country || 'N/A',
                    country_code: json.countryCode || 'N/A',
                    latitude: json.lat || 0,
                    longitude: json.lon || 0,
                    asn,
                    org: json.isp || 'N/A'
                }), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 7. /api/dnsresolver
        if (pathname === '/api/dnsresolver') {
            const hostname = url.searchParams.get('hostname');
            const type = url.searchParams.get('type') || 'A';
            if (!hostname) {
                return new Response(JSON.stringify({ error: 'Missing hostname parameter' }), { status: 400 });
            }

            try {
                const dohPromises = Object.entries(DOH_SERVERS).map(([name, dohUrl]) => resolveDoh(hostname, type, name, dohUrl));
                const result_doh = await Promise.all(dohPromises);
                return new Response(JSON.stringify({
                    hostname,
                    result_dns: result_doh,
                    result_doh
                }), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 8. /api/whois
        if (pathname === '/api/whois') {
            const query = (url.searchParams.get('q') || '').trim();
            if (!query) {
                return new Response(JSON.stringify({ error: 'No address provided' }), { status: 400 });
            }
            try {
                const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query) || query.includes(':');
                const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(query);
                if (!isIp && !isDomain) {
                    return new Response(JSON.stringify({ error: 'Invalid IP or domain address' }), { status: 400 });
                }

                const rdapUrl = isIp ? `https://rdap.org/ip/${encodeURIComponent(query)}` : `https://rdap.org/domain/${encodeURIComponent(query)}`;
                const res = await fetch(rdapUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)',
                        'Accept': 'application/rdap+json, application/json'
                    },
                    redirect: 'manual'
                });

                if (res.status >= 300 && res.status < 400) {
                    return new Response(JSON.stringify({ error: 'RDAP query redirected to external authority (manual lookup required)' }), { status: 502 });
                }

                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 9. /api/macchecker
        if (pathname === '/api/macchecker') {
            let mac = url.searchParams.get('mac') || '';
            mac = mac.replace(/[:-\s]/g, '');
            if (!mac) {
                return new Response(JSON.stringify({ error: 'No MAC address provided' }), { status: 400 });
            }

            const token = env.MAC_LOOKUP_API_KEY || '';
            const apiUrl = token ? `https://api.maclookup.app/v2/macs/${mac}?apiKey=${token}` : `https://api.maclookup.app/v2/macs/${mac}`;

            try {
                const res = await fetch(apiUrl);
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 10. /api/cfradar
        if (pathname === '/api/cfradar') {
            const asn = (url.searchParams.get('asn') || '').replace(/^AS/i, '').trim();
            if (!asn || !/^[0-9]+$/.test(asn)) {
                return new Response(JSON.stringify({ error: 'Invalid or missing ASN provided (must be numeric)' }), { status: 400 });
            }

            const cfToken = env.CLOUDFLARE_API || '';
            if (!cfToken) {
                return new Response(JSON.stringify({ error: 'CLOUDFLARE_API not set' }), { status: 400 });
            }

            const fetchOptions = {
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)'
                }
            };

            const fetchCf = async (endpoint) => {
                const r = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, fetchOptions);
                return r.json();
            };

            try {
                const [asnInfo, ipVersion, httpProtocol, deviceType, botType] = await Promise.all([
                    fetchCf(`/radar/entities/asns/${asn}`),
                    fetchCf(`/radar/http/summary/ip_version?asn=${asn}&dateRange=7d`),
                    fetchCf(`/radar/http/summary/http_protocol?asn=${asn}&dateRange=7d`),
                    fetchCf(`/radar/http/summary/device_type?asn=${asn}&dateRange=7d`),
                    fetchCf(`/radar/http/summary/bot_class?asn=${asn}&dateRange=7d`)
                ]);

                const resData = {
                    asnName: asnInfo?.result?.asn?.name,
                    asnOrgName: asnInfo?.result?.asn?.orgName,
                    estimatedUsers: parseFloat(asnInfo?.result?.asn?.estimatedUsers?.estimatedUsers || 0).toLocaleString(),
                    IPv4_Pct: `${parseFloat(ipVersion?.result?.summary_0?.IPv4 || 0).toFixed(2)}%`,
                    IPv6_Pct: `${parseFloat(ipVersion?.result?.summary_0?.IPv6 || 0).toFixed(2)}%`,
                    HTTP_Pct: `${parseFloat(httpProtocol?.result?.summary_0?.http || 0).toFixed(2)}%`,
                    HTTPS_Pct: `${parseFloat(httpProtocol?.result?.summary_0?.https || 0).toFixed(2)}%`,
                    Desktop_Pct: `${parseFloat(deviceType?.result?.summary_0?.desktop || 0).toFixed(2)}%`,
                    Mobile_Pct: `${parseFloat(deviceType?.result?.summary_0?.mobile || 0).toFixed(2)}%`,
                    Bot_Pct: `${parseFloat(botType?.result?.summary_0?.bot || 0).toFixed(2)}%`,
                    Human_Pct: `${parseFloat(botType?.result?.summary_0?.human || 0).toFixed(2)}%`
                };

                for (const k in resData) {
                    if (resData[k] === 'NaN' || resData[k] === 'NaN%') delete resData[k];
                }

                return new Response(JSON.stringify(resData), {
                    headers: { 'content-type': 'application/json; charset=utf-8' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // 11. /llms.txt and /llms-full.txt
        if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
            try {
                const assetResponse = await getAssetFromKV(
                    {
                        request,
                        waitUntil: ctx.waitUntil.bind(ctx),
                    },
                    {
                        ASSET_NAMESPACE: env.__STATIC_CONTENT,
                        ASSET_MANIFEST: assetManifest,
                        mapRequestUrl: req => new Request(req.url, req)
                    }
                );
                const response = new Response(assetResponse.body, assetResponse);
                response.headers.set('content-type', 'text/markdown; charset=utf-8');
                response.headers.set('link', '</llms.txt>; rel="llms-txt"; type="text/markdown"');
                return response;
            } catch (e) {
                return new Response(`File not found: ${e.message}`, { status: 404 });
            }
        }

        // Fallback to serving static assets from KV
        try {
            return await getAssetFromKV(
                {
                    request,
                    waitUntil: ctx.waitUntil.bind(ctx),
                },
                {
                    ASSET_NAMESPACE: env.__STATIC_CONTENT,
                    ASSET_MANIFEST: assetManifest,
                }
            );
        } catch (e) {
            try {
                const notFoundResponse = await getAssetFromKV(
                    {
                        request: new Request(`${url.origin}/index.html`, request),
                        waitUntil: ctx.waitUntil.bind(ctx),
                    },
                    {
                        ASSET_NAMESPACE: env.__STATIC_CONTENT,
                        ASSET_MANIFEST: assetManifest,
                    }
                );
                return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 });
            } catch (err) {
                return new Response(`Resource not found: ${e.message}`, { status: 404 });
            }
        }
    }
};
