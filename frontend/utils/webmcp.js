/**
 * WebMCP Browser Registration Helper
 * Registers 8888IP diagnostic tools directly with `document.modelContext` in WebMCP-compatible browsers (Chrome 146+).
 */
import { MCP_TOOLS } from '../../common/mcp.js';

export function setupWebMcp() {
    if (typeof document === 'undefined') return;

    // Check if the browser supports the WebMCP standard
    if ('modelContext' in document && typeof document.modelContext?.registerTool === 'function') {
        const registeredTools = new Set();

        MCP_TOOLS.forEach(tool => {
            if (registeredTools.has(tool.name)) return;
            try {
                document.modelContext.registerTool({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    execute: async (args) => {
                        try {
                            const res = await fetch('/mcp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    id: Date.now(),
                                    method: 'tools/call',
                                    params: { name: tool.name, arguments: args }
                                })
                            });
                            const data = await res.json();
                            if (data.result) {
                                return data.result;
                            }
                            if (data.error) {
                                return {
                                    content: [{ type: 'text', text: `Error: ${data.error.message}` }],
                                    isError: true
                                };
                            }
                            return {
                                content: [{ type: 'text', text: JSON.stringify(data) }],
                                isError: false
                            };
                        } catch (e) {
                            return {
                                content: [{ type: 'text', text: `Network error: ${e.message}` }],
                                isError: true
                            };
                        }
                    }
                });
                registeredTools.add(tool.name);
                console.log(`[WebMCP] Successfully registered tool: ${tool.name}`);
            } catch (err) {
                console.warn(`[WebMCP] Failed to register tool ${tool.name}:`, err);
            }
        });
    }
}
