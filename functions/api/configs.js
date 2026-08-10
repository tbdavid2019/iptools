export async function onRequest(context) {
    const { env } = context;

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
