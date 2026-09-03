/**
 * 8888IP Model Context Protocol (MCP) & WebMCP Tools Definition & Handler
 * Compatible with JSON-RPC 2.0, Model Context Protocol (2024-11-05), and Cloudflare WebMCP.
 */

import { isValidIP } from './valid-ip.js';

export const MCP_SERVER_INFO = {
    name: '8888ip-network-tools',
    version: '1.0.0',
    description: '8888IP Network & IP Diagnostics MCP Server'
};

export const MCP_PROTOCOL_VERSION = '2024-11-05';

export const MCP_TOOLS = [
    {
        name: 'get_client_ip',
        description: 'Get the caller\'s public IP address and connection details (location, user agent, timestamp).',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'lookup_ip_geo',
        description: 'Look up IP geolocation, ASN, ISP, country, city, coordinates and datacenter/proxy detection for an IPv4 or IPv6 address.',
        inputSchema: {
            type: 'object',
            properties: {
                ip: {
                    type: 'string',
                    description: 'The IPv4 or IPv6 address to look up. If omitted, looks up the caller\'s IP address.'
                },
                lang: {
                    type: 'string',
                    description: 'Language code for localized names (e.g. "en", "zh-CN", "ja", "fr", "es"). Default is "en".'
                }
            }
        }
    },
    {
        name: 'resolve_dns',
        description: 'Resolve domain names using DNS-over-HTTPS (DoH) across multiple global public DNS providers (Google, Cloudflare, AdGuard, AliDNS).',
        inputSchema: {
            type: 'object',
            properties: {
                hostname: {
                    type: 'string',
                    description: 'The domain name or hostname to resolve (e.g. "google.com", "cloudflare.com").'
                },
                type: {
                    type: 'string',
                    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'PTR', 'SOA'],
                    description: 'The DNS record type to query. Default is "A".'
                }
            },
            required: ['hostname']
        }
    },
    {
        name: 'whois_lookup',
        description: 'Query WHOIS and RDAP registration data for a domain name or IP address.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Domain name (e.g. "github.com") or IP address (e.g. "1.1.1.1") to inspect.'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'mac_lookup',
        description: 'Look up vendor, company, and OUI hardware manufacturer details for a network MAC address.',
        inputSchema: {
            type: 'object',
            properties: {
                mac: {
                    type: 'string',
                    description: 'MAC address or OUI prefix (e.g. "00:1A:2B:3C:4D:5E" or "001A2B").'
                }
            },
            required: ['mac']
        }
    },
    {
        name: 'cf_radar_lookup',
        description: 'Query Cloudflare Radar global intelligence statistics for an Autonomous System Number (ASN), including traffic distribution, bot percentage, device types, and IPv6 adoption.',
        inputSchema: {
            type: 'object',
            properties: {
                asn: {
                    type: 'string',
                    description: 'Autonomous System Number (e.g. "AS13335" or "15169").'
                }
            },
            required: ['asn']
        }
    }
];

async function executeGetClientIp(args, context) {
    return {
        ip: context.clientIp || 'unknown',
        country: context.country || 'unknown',
        city: context.city || 'unknown',
        userAgent: context.userAgent || 'unknown',
        timestamp: new Date().toISOString()
    };
}

async function executeLookupIpGeo(args, context) {
    if (args.ip && !isValidIP(args.ip)) {
        throw new Error('Invalid IP address parameter: must be a valid IPv4 or IPv6 address.');
    }
    const ip = args.ip || context.clientIp || '1.1.1.1';
    const lang = args.lang || 'en';
    const env = context.env || {};

    const ipapiisKey = env.IPAPIIS_API_KEY || (typeof process !== 'undefined' && process?.env?.IPAPIIS_API_KEY);
    if (ipapiisKey) {
        try {
            const keys = ipapiisKey.split(',').filter(Boolean);
            const key = keys[Math.floor(Math.random() * keys.length)];
            const res = await fetch(`https://api.ipapi.is?q=${encodeURIComponent(ip)}&key=${key}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
            });
            if (res.ok) {
                const json = await res.json();
                const asn = json.asn || {};
                const location = json.location || {};
                return {
                    ip: json.ip || ip,
                    city: location.city || 'N/A',
                    region: location.state || 'N/A',
                    country: location.country_code || 'N/A',
                    country_name: location.country || 'N/A',
                    country_code: location.country_code || 'N/A',
                    latitude: location.latitude || 0,
                    longitude: location.longitude || 0,
                    asn: asn.asn === undefined ? 'N/A' : `AS${asn.asn}`,
                    org: asn.org || 'N/A',
                    isHosting: json.is_datacenter || false,
                    isProxy: json.is_proxy || json.is_vpn || json.is_tor || false
                };
            }
        } catch (e) {
            // fallback
        }
    }

    const ipinfoToken = env.IPINFO_API_TOKEN || (typeof process !== 'undefined' && process?.env?.IPINFO_API_TOKEN);
    if (ipinfoToken) {
        try {
            const tokens = ipinfoToken.split(',').filter(Boolean);
            const token = tokens[Math.floor(Math.random() * tokens.length)];
            const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
            });
            if (res.ok) {
                const json = await res.json();
                const [lat, lon] = (json.loc || '0,0').split(',').map(Number);
                const orgParts = (json.org || 'AS0 Unknown').split(' ');
                return {
                    ip: json.ip || ip,
                    city: json.city || 'N/A',
                    region: json.region || 'N/A',
                    country: json.country || 'N/A',
                    country_name: json.country || 'N/A',
                    country_code: json.country || 'N/A',
                    latitude: lat || 0,
                    longitude: lon || 0,
                    asn: orgParts[0] || 'AS0',
                    org: orgParts.slice(1).join(' ') || 'Unknown'
                };
            }
        } catch (e) {
            // fallback
        }
    }

    // Default Fallback: ip-api.com
    try {
        const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=66842623&lang=${encodeURIComponent(lang)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
        });
        const json = await res.json();
        const asn = json.as ? json.as.split(' ')[0] : 'N/A';
        return {
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
        };
    } catch (e) {
        return { error: `Failed to lookup IP: ${e.message}` };
    }
}

async function executeResolveDns(args) {
    const { hostname, type = 'A' } = args;
    if (!hostname) {
        throw new Error('Missing required parameter: hostname');
    }
    const dohServers = {
        'Google': 'https://dns.google/resolve?',
        'Cloudflare': 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&',
        'AdGuard': 'https://dns.adguard.com/resolve?',
        'AliDNS': 'https://dns.alidns.com/resolve?',
    };

    const results = {};
    const promises = Object.entries(dohServers).map(async ([name, url]) => {
        try {
            const res = await fetch(`${url}name=${encodeURIComponent(hostname)}&type=${encodeURIComponent(type)}`, {
                headers: { 'Accept': 'application/dns-json' }
            });
            const data = await res.json();
            const answers = data.Answer ? data.Answer.map(ans => ans.data) : [];
            results[name] = answers.length ? answers : ['No record / N/A'];
        } catch (e) {
            results[name] = ['Error: ' + e.message];
        }
    });

    await Promise.all(promises);
    return {
        hostname,
        type,
        servers: results
    };
}

async function executeWhoisLookup(args) {
    const query = (args.query || '').trim();
    if (!query) {
        throw new Error('Missing required parameter: query');
    }
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query) || query.includes(':');
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(query);
    if (!isIp && !isDomain) {
        throw new Error('Invalid query: must be a valid IP address or domain name.');
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
        return { query, status: res.status, message: 'RDAP query redirected to external authority (manual lookup required).' };
    }
    if (!res.ok) {
        return { query, status: res.status, message: 'RDAP query returned non-200 status' };
    }
    return await res.json();
}

async function executeMacLookup(args, context) {
    let mac = (args.mac || '').replace(/[:-\s]/g, '');
    if (!mac) {
        throw new Error('Missing required parameter: mac');
    }
    const env = context.env || {};
    const token = env.MAC_LOOKUP_API_KEY || (typeof process !== 'undefined' && process?.env?.MAC_LOOKUP_API_KEY) || '';
    const apiUrl = token ? `https://api.maclookup.app/v2/macs/${mac}?apiKey=${token}` : `https://api.maclookup.app/v2/macs/${mac}`;
    const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)' }
    });
    return await res.json();
}

async function executeCfRadarLookup(args, context) {
    const rawAsn = (args.asn || '').replace(/^AS/i, '').trim();
    if (!rawAsn || !/^[0-9]+$/.test(rawAsn)) {
        throw new Error('Invalid ASN parameter: must be a positive integer.');
    }
    const asn = rawAsn;
    const env = context.env || {};
    const cfToken = env.CLOUDFLARE_API || (typeof process !== 'undefined' && process?.env?.CLOUDFLARE_API) || '';
    if (!cfToken) {
        return {
            asn: `AS${asn}`,
            notice: 'Cloudflare Radar API key (CLOUDFLARE_API) is not configured on this server.'
        };
    }
    const fetchCf = async (endpoint) => {
        const r = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${cfToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; 8888IP/1.0)'
            }
        });
        return r.json();
    };

    const [asnInfo, ipVersion, httpProtocol, deviceType, botType] = await Promise.all([
        fetchCf(`/radar/entities/asns/${asn}`),
        fetchCf(`/radar/http/summary/ip_version?asn=${asn}&dateRange=7d`),
        fetchCf(`/radar/http/summary/http_protocol?asn=${asn}&dateRange=7d`),
        fetchCf(`/radar/http/summary/device_type?asn=${asn}&dateRange=7d`),
        fetchCf(`/radar/http/summary/bot_class?asn=${asn}&dateRange=7d`)
    ]);

    const resData = {
        asn: `AS${asn}`,
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
    return resData;
}

export async function executeTool(name, args = {}, context = {}) {
    switch (name) {
        case 'get_client_ip':
            return await executeGetClientIp(args, context);
        case 'lookup_ip_geo':
            return await executeLookupIpGeo(args, context);
        case 'resolve_dns':
            return await executeResolveDns(args);
        case 'whois_lookup':
            return await executeWhoisLookup(args);
        case 'mac_lookup':
            return await executeMacLookup(args, context);
        case 'cf_radar_lookup':
            return await executeCfRadarLookup(args, context);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

/**
 * Handle a standard MCP JSON-RPC 2.0 request
 */
export async function handleMcpRequest(body, context = {}) {
    if (!body || typeof body !== 'object') {
        return {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error: Invalid JSON payload' }
        };
    }

    const { id = 1, method, params = {} } = body;

    try {
        switch (method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        protocolVersion: MCP_PROTOCOL_VERSION,
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: MCP_SERVER_INFO
                    }
                };

            case 'ping':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {}
                };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        tools: MCP_TOOLS
                    }
                };

            case 'tools/call': {
                const toolName = params.name;
                const toolArgs = params.arguments || {};
                if (!toolName) {
                    return {
                        jsonrpc: '2.0',
                        id,
                        error: { code: -32602, message: 'Invalid params: Missing tool name' }
                    };
                }

                try {
                    const toolResult = await executeTool(toolName, toolArgs, context);
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
                                }
                            ],
                            isError: false
                        }
                    };
                } catch (toolError) {
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: `Error executing ${toolName}: ${toolError.message}`
                                }
                            ],
                            isError: true
                        }
                    };
                }
            }

            default:
                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: `Method not found: ${method}` }
                };
        }
    } catch (err) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: `Internal error: ${err.message}` }
        };
    }
}
