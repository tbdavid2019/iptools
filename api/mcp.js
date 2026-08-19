import { handleMcpRequest, MCP_SERVER_INFO, MCP_TOOLS } from '../common/mcp.js';

export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method === 'GET') {
        return res.json({
            status: 'ok',
            protocol: 'Model Context Protocol (JSON-RPC 2.0)',
            server: MCP_SERVER_INFO,
            endpoint: '/mcp',
            usage: 'Send POST requests with JSON-RPC 2.0 payload (e.g. tools/list or tools/call)',
            tools: MCP_TOOLS
        });
    }

    const clientIp = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip);
    const userAgent = req.headers['user-agent'] || '';

    const context = {
        clientIp,
        userAgent,
        env: process.env,
        country: req.headers['cf-ipcountry'] || 'unknown',
        city: req.headers['cf-ipcity'] || 'unknown'
    };

    const response = await handleMcpRequest(req.body, context);
    return res.json(response);
};
