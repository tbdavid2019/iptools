export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);

    // If user accesses root path with curl/wget, return plain text IP directly
    if (url.pathname === '/') {
        const userAgent = request.headers.get('user-agent') || '';
        if (/^(curl|wget)/i.test(userAgent)) {
            const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
            return new Response(`${clientIp}\n`, {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }
    }

    return next();
}
