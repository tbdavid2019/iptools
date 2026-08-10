import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const userAgent = request.headers.get('user-agent') || '';
        const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

        // Command-line curl/wget query on root /
        if (url.pathname === '/' && /^(curl|wget)/i.test(userAgent)) {
            return new Response(`${clientIp}\n`, {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }

        // API endpoint /api/ip
        if (url.pathname === '/api/ip') {
            return new Response(`${clientIp}\n`, {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }

        // API endpoint /api/configs
        if (url.pathname === '/api/configs') {
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
                // Fallback to index.html for SPA routes if needed
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
