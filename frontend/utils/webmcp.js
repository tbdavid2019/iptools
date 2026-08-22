/**
 * WebMCP (Web Model Context Protocol) Implementation for 8888IP
 * Documentation: https://developer.chrome.com/docs/ai/webmcp
 *
 * Provides:
 * 1. Imperative WebMCP API registration (`document.modelContext.registerTool`, `getTools`, `executeTool`)
 *    with compatibility support for `navigator.modelContext` and `window.modelContext`.
 * 2. Declarative WebMCP annotations support (form `toolname`, `tooldescription`, `toolparamdescription`, `toolautosubmit`).
 * 3. Lifecycle events (`toolactivated`, `toolcancel`, `toolchange`).
 * 4. DevTools / Chrome Extension testing bridge (`window.__webmcp`).
 */

import { transformDataFromIPapi } from './transform-ip-data.js';
import { isValidIP } from './valid-ip.js';
import { authenticatedFetch } from './authenticated-fetch.js';

class ModelContextPolyfill extends EventTarget {
  constructor() {
    super();
    this.tools = new Map();
  }

  /**
   * Register a tool with the model context.
   * @param {Object} tool - Tool definition object
   * @param {Object} [options] - Options like signal, exposedTo
   */
  async registerTool(tool, options = {}) {
    if (!tool || typeof tool.name !== 'string') {
      throw new Error('Tool must specify a valid name string.');
    }

    const toolRecord = {
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      execute: tool.execute || (async () => null),
      annotations: tool.annotations || {},
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      window: typeof window !== 'undefined' ? window : null,
    };

    if (options.signal) {
      if (options.signal.aborted) {
        return;
      }
      options.signal.addEventListener('abort', () => {
        this.tools.delete(tool.name);
        this.dispatchEvent(new CustomEvent('toolchange', { detail: { tool: toolRecord, action: 'unregister' } }));
      });
    }

    this.tools.set(tool.name, toolRecord);
    this.dispatchEvent(new CustomEvent('toolchange', { detail: { tool: toolRecord, action: 'register' } }));
    return toolRecord;
  }

  /**
   * Unregister a tool by name.
   * @param {string} name
   */
  async unregisterTool(name) {
    if (this.tools.has(name)) {
      const tool = this.tools.get(name);
      this.tools.delete(name);
      this.dispatchEvent(new CustomEvent('toolchange', { detail: { tool, action: 'unregister' } }));
      return true;
    }
    return false;
  }

  /**
   * Get all registered tools.
   * @param {Object} [options]
   */
  async getTools(options = {}) {
    return Array.from(this.tools.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Execute a tool by instance or name.
   * @param {Object|string} toolOrName
   * @param {Object|string} [inputArgs]
   * @param {Object} [options]
   */
  async executeTool(toolOrName, inputArgs = {}, options = {}) {
    const name = typeof toolOrName === 'string' ? toolOrName : toolOrName?.name;
    const tool = this.tools.get(name);
    if (!tool || typeof tool.execute !== 'function') {
      throw new Error(`WebMCP tool "${name}" not found or not executable.`);
    }

    let parsedArgs = inputArgs;
    if (typeof inputArgs === 'string') {
      try {
        parsedArgs = JSON.parse(inputArgs || '{}');
      } catch (e) {
        throw new Error(`Invalid JSON input for WebMCP tool "${name}": ${e.message}`);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toolactivated', { detail: { toolName: name, args: parsedArgs } }));
    }

    if (options.signal) {
      if (options.signal.aborted) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('toolcancel', { detail: { toolName: name } }));
        }
        throw new Error('Tool execution aborted');
      }
      options.signal.addEventListener('abort', () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('toolcancel', { detail: { toolName: name } }));
        }
      });
    }

    try {
      const result = await tool.execute(parsedArgs, options);
      return result;
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toolcancel', { detail: { toolName: name, error: err.message } }));
      }
      throw err;
    }
  }
}

/**
 * Setup and initialize WebMCP tools and listeners in the application.
 * @param {Object} app - Vue app instance
 * @param {Object} router - Vue Router instance
 * @param {Object} store - Pinia main store instance
 */
export function initWebMCP(app, router, store) {
  if (typeof window === 'undefined') return;

  // Resolve native or polyfill modelContext
  let modelContext = document.modelContext || (typeof navigator !== 'undefined' ? navigator.modelContext : null) || window.modelContext;
  const polyfill = new ModelContextPolyfill();

  if (!modelContext) {
    modelContext = polyfill;
    try {
      document.modelContext = modelContext;
    } catch (e) { /* ignore read-only */ }
    try {
      window.modelContext = modelContext;
    } catch (e) { /* ignore */ }
  } else {
    // Forward events and mirror tools
    modelContext.addEventListener?.('toolchange', (e) => {
      polyfill.dispatchEvent(new CustomEvent('toolchange', { detail: e.detail }));
    });
  }

  // Define tools
  const tools = [
    // 1. Get current public IP info
    {
      name: 'get_my_ip',
      description: 'Get the current user public IP addresses (IPv4 & IPv6), geolocation (country, city, coordinates), ISP, ASN, and network info.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async () => {
        try {
          const res = await fetch('/api/ipchecking');
          const data = await res.json();
          return {
            status: 'success',
            ip: data.ip,
            country: data.country_name,
            countryCode: data.country,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.org,
            asn: data.asn,
            proxyDetect: data.proxyDetect || null,
            allDetectedIPs: store?.allIPs || [data.ip],
          };
        } catch (e) {
          // Fallback to plain IP endpoint
          const res = await fetch('/api/ip');
          const ipText = (await res.text()).trim();
          return {
            status: 'success',
            ip: ipText,
            allDetectedIPs: store?.allIPs || [ipText],
          };
        }
      },
    },

    // 2. Lookup any IP or domain
    {
      name: 'lookup_ip',
      description: 'Look up detailed geolocation, ISP, ASN, organization, proxy/VPN/datacenter detection, and risk score for any IPv4, IPv6, or domain name.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'IPv4 address (e.g. 8.8.8.8), IPv6 address, or domain name (e.g. cloudflare.com) to lookup.',
          },
          source: {
            type: 'string',
            enum: ['8888ip', 'ipinfo', 'ipapicom', 'ipapiis', 'ip2location', 'ipsb', 'maxmind'],
            description: 'Database source to query (default: 8888ip).',
          },
        },
        required: ['query'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async ({ query, source = '8888ip' }) => {
        if (!query) throw new Error('Query parameter is required.');
        const cleanQuery = query.trim();

        const endpointMap = {
          '8888ip': `/api/ipchecking?ip=${encodeURIComponent(cleanQuery)}`,
          'ipinfo': `/api/ipinfo?ip=${encodeURIComponent(cleanQuery)}`,
          'ipapicom': `/api/ipapicom?ip=${encodeURIComponent(cleanQuery)}`,
          'ipapiis': `/api/ipapiis?ip=${encodeURIComponent(cleanQuery)}`,
          'ip2location': `/api/ip2location?ip=${encodeURIComponent(cleanQuery)}`,
          'ipsb': `/api/ipsb?ip=${encodeURIComponent(cleanQuery)}`,
          'maxmind': `/api/maxmind?ip=${encodeURIComponent(cleanQuery)}`,
        };

        const url = endpointMap[source] || endpointMap['8888ip'];
        const res = await authenticatedFetch(url);
        return {
          status: 'success',
          query: cleanQuery,
          source,
          data: res,
        };
      },
    },

    // 3. WHOIS lookup
    {
      name: 'whois_lookup',
      description: 'Perform a WHOIS query for a domain name or IP address to retrieve registrar, creation/expiry dates, status, and nameservers.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Domain name (e.g. google.com) or IP address (e.g. 1.1.1.1) to query WHOIS records for.',
          },
        },
        required: ['query'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async ({ query }) => {
        if (!query) throw new Error('Query parameter is required.');
        const cleanQuery = query.trim().replace(/^https?:\/\//, '').split('/')[0];
        const res = await fetch(`/api/whois?q=${encodeURIComponent(cleanQuery)}`);
        if (!res.ok) {
          throw new Error(`WHOIS request failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        return {
          status: 'success',
          query: cleanQuery,
          whois: data,
        };
      },
    },

    // 4. DNS Resolver
    {
      name: 'resolve_dns',
      description: 'Resolve DNS records (A, AAAA, CNAME, MX, TXT, NS) for a given hostname using multiple global public DNS resolvers and DNS-over-HTTPS (DoH) providers.',
      inputSchema: {
        type: 'object',
        properties: {
          hostname: {
            type: 'string',
            description: 'Domain name or hostname to query (e.g. example.com).',
          },
          type: {
            type: 'string',
            enum: ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'],
            description: 'DNS record type to resolve. Defaults to A.',
          },
        },
        required: ['hostname'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async ({ hostname, type = 'A' }) => {
        if (!hostname) throw new Error('Hostname parameter is required.');
        const cleanHost = hostname.trim().replace(/^https?:\/\//, '').split('/')[0];
        const res = await fetch(`/api/dnsresolver?hostname=${encodeURIComponent(cleanHost)}&type=${encodeURIComponent(type)}`);
        if (!res.ok) {
          throw new Error(`DNS resolver request failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        return {
          status: 'success',
          hostname: cleanHost,
          type,
          result: data,
        };
      },
    },

    // 5. MAC Vendor Checker
    {
      name: 'mac_vendor_lookup',
      description: 'Lookup a MAC address or OUI prefix to identify hardware vendor, company name, address, and assignment type.',
      inputSchema: {
        type: 'object',
        properties: {
          mac: {
            type: 'string',
            description: 'MAC address (e.g. 00:1A:2B:3C:4D:5E, 00-1A-2B, or 001A2B) to lookup.',
          },
        },
        required: ['mac'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async ({ mac }) => {
        if (!mac) throw new Error('MAC address parameter is required.');
        const cleanMac = mac.replace(/[:-]/g, '').trim();
        const res = await fetch(`/api/macchecker?mac=${encodeURIComponent(cleanMac)}`);
        if (!res.ok) {
          throw new Error(`MAC lookup failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        return {
          status: 'success',
          mac: cleanMac,
          result: data,
        };
      },
    },

    // 6. Censorship Check
    {
      name: 'check_censorship',
      description: 'Check whether a domain name or URL is accessible or blocked across global network checkpoints and high-risk censorship regions.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Website URL or domain name to test (e.g. wikipedia.org or https://github.com).',
          },
        },
        required: ['url'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async ({ url }) => {
        if (!url) throw new Error('URL parameter is required.');
        const cleanHost = url.trim().replace(/^https?:\/\//, '').split('/')[0];
        try {
          const res = await fetch('https://api.globalping.io/v1/measurements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locations: [
                { country: 'CN', limit: 2 },
                { country: 'RU', limit: 2 },
                { country: 'TR', limit: 1 },
                { country: 'US', limit: 1 },
                { country: 'JP', limit: 1 },
                { country: 'DE', limit: 1 },
              ],
              target: cleanHost,
              type: 'http',
              measurementOptions: {
                request: { host: cleanHost, path: '/', method: 'HEAD' },
                port: 443,
                protocol: 'HTTPS',
              },
            }),
          });
          if (!res.ok) throw new Error(`Globalping request failed with HTTP ${res.status}`);
          const initial = await res.json();

          // Wait 2.5s and poll for completed results
          await new Promise((r) => setTimeout(r, 2500));
          const resPoll = await fetch(`https://api.globalping.io/v1/measurements/${initial.id}`);
          if (resPoll.ok) {
            const data = await resPoll.json();
            return {
              status: 'success',
              target: cleanHost,
              measurementStatus: data.status,
              results: (data.results || []).map((r) => ({
                country: r.probe?.country,
                city: r.probe?.city,
                network: r.probe?.network,
                status: r.result?.statusCode ? 'accessible' : 'failed',
                statusCode: r.result?.statusCode || null,
                timingsMs: r.result?.timings?.total || null,
              })),
            };
          }
          return { status: 'in-progress', measurementId: initial.id, target: cleanHost };
        } catch (err) {
          return { status: 'error', target: cleanHost, error: err.message };
        }
      },
    },

    // 7. Test Connectivity
    {
      name: 'test_connectivity',
      description: 'Test network latency and availability to major global internet services (Google, Cloudflare, GitHub, YouTube, Wikipedia, etc.).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async () => {
        const targets = [
          { name: 'Google', url: 'https://www.google.com/favicon.ico' },
          { name: 'Cloudflare', url: 'https://www.cloudflare.com/favicon.ico' },
          { name: 'GitHub', url: 'https://github.com/favicon.ico' },
          { name: 'YouTube', url: 'https://www.youtube.com/favicon.ico' },
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/static/favicon/wikipedia.ico' },
          { name: 'Bilibili', url: 'https://www.bilibili.com/favicon.ico' },
        ];

        const tests = await Promise.all(
          targets.map(async (target) => {
            const start = performance.now();
            try {
              await new Promise((resolve, reject) => {
                const img = new Image();
                const timer = setTimeout(() => {
                  img.src = '';
                  reject(new Error('timeout'));
                }, 3500);
                img.onload = () => {
                  clearTimeout(timer);
                  resolve();
                };
                img.onerror = () => {
                  clearTimeout(timer);
                  resolve(); // Response received even if 404
                };
                img.src = `${target.url}?_t=${Date.now()}`;
              });
              const latency = Math.round(performance.now() - start);
              return { name: target.name, status: 'Available', latencyMs: latency };
            } catch (err) {
              return { name: target.name, status: 'Unavailable', error: err.message };
            }
          })
        );

        return {
          status: 'success',
          timestamp: new Date().toISOString(),
          results: tests,
        };
      },
    },

    // 8. Get Browser Environment Info
    {
      name: 'get_browser_info',
      description: 'Inspect current browser environment details including User-Agent, platform OS, GPU/WebGL renderer, screen resolution, language, and network connection status.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async () => {
        let gpu = 'N/A';
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
              gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
            }
          }
        } catch (e) { /* ignore */ }

        return {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          online: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled,
          screen: {
            width: window.screen?.width,
            height: window.screen?.height,
            colorDepth: window.screen?.colorDepth,
            devicePixelRatio: window.devicePixelRatio,
          },
          gpu,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          connection: navigator.connection
            ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
              }
            : 'N/A',
        };
      },
    },

    // 9. Navigate to Tool in UI
    {
      name: 'navigate_to',
      description: 'Navigate the application to a specific tool or view in the user interface (e.g. /pingtest, /mtrtest, /whois, /dnsresolver, /macchecker, /browserinfo, /censorshipcheck, /ruletest, /invisibilitytest, /securitychecklist).',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            enum: [
              '/',
              '/pingtest',
              '/mtrtest',
              '/whois',
              '/dnsresolver',
              '/macchecker',
              '/browserinfo',
              '/censorshipcheck',
              '/ruletest',
              '/invisibilitytest',
              '/securitychecklist',
            ],
            description: 'Route path to navigate to in the application.',
          },
        },
        required: ['path'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async ({ path }) => {
        if (router) {
          await router.push(path);
          return {
            status: 'success',
            navigatedTo: path,
            message: `Successfully navigated application view to ${path}`,
          };
        }
        return { status: 'error', message: 'Router instance unavailable' };
      },
    },

    // 10. Toggle Dark Mode Theme
    {
      name: 'toggle_dark_mode',
      description: 'Toggle or set dark mode / light mode theme for the web application.',
      inputSchema: {
        type: 'object',
        properties: {
          enable: {
            type: 'boolean',
            description: 'Set true for dark mode, false for light mode. If omitted, toggles current theme.',
          },
        },
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async ({ enable } = {}) => {
        if (store) {
          const nextState = enable !== undefined ? enable : !store.isDarkMode;
          store.setDarkMode(nextState);
          store.updatePreference('theme', nextState ? 'dark' : 'light');
          return {
            status: 'success',
            isDarkMode: nextState,
            theme: nextState ? 'dark' : 'light',
          };
        }
        return { status: 'error', message: 'Store instance unavailable' };
      },
    },
  ];

  // Register all tools to modelContext
  tools.forEach(async (tool) => {
    try {
      if (modelContext && typeof modelContext.registerTool === 'function') {
        await modelContext.registerTool(tool);
      }
      if (modelContext !== polyfill) {
        await polyfill.registerTool(tool);
      }
    } catch (err) {
      console.warn(`[WebMCP] Failed to register tool "${tool.name}":`, err);
    }
  });

  // Setup Declarative event listeners
  window.addEventListener('toolactivated', (e) => {
    const name = e.detail?.toolName || e.toolName;
    console.log(`%c[WebMCP] Tool activated: ${name}`, 'color: #0d6efd; font-weight: bold;', e.detail?.args || '');
  });

  window.addEventListener('toolcancel', (e) => {
    const name = e.detail?.toolName || e.toolName;
    console.log(`%c[WebMCP] Tool cancelled: ${name}`, 'color: #dc3545;', e.detail || '');
  });

  // Expose inspection & testing bridge on window.__webmcp
  window.__webmcp = {
    version: '1.0.0',
    status: 'active',
    modelContext: modelContext || polyfill,
    tools: polyfill.tools,
    getTools: () => (modelContext?.getTools ? modelContext.getTools() : polyfill.getTools()),
    executeTool: (name, args) => (modelContext?.executeTool ? modelContext.executeTool(name, args) : polyfill.executeTool(name, args)),
    listToolNames: () => Array.from(polyfill.tools.keys()),
  };

  console.log(
    '%c[WebMCP] Web Model Context Protocol initialized with 10 tools. Try `await window.__webmcp.getTools()` in console.',
    'background: #0d6efd; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;'
  );
}

export const setupWebMcp = (app, router, store) => initWebMCP(app, router, store);

export default {
  initWebMCP,
  setupWebMcp,
};
