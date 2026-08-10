export async function onRequest(context) {
    const { request } = context;
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';

    return new Response(`${clientIp}\n`, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store'
        }
    });
}
