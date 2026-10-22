// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Andrei Kozhevnikov <coderusinbox@gmail.com>

import Bootstrap from './socket-bootstrap.js';

const tool = {
  name: 'qtqaengine_action',
  description: 'Send one action to a running qt-qaengine socket.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string' },
      params: { type: 'array' },
      host: { type: 'string' },
      port: { type: 'number' },
      timeout: { type: 'number' },
    },
    required: ['action'],
  },
};

function frame(obj) {
  const body = Buffer.from(JSON.stringify(obj));
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`),
    body,
  ]);
}

async function handle(msg) {
  if (msg.method === 'initialize') {
    return {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'qt-qaengine-mcp', version: '1.0.0' },
    };
  }
  if (msg.method === 'ping') {
    return {};
  }
  if (msg.method === 'tools/list') {
    return { tools: [tool] };
  }
  if (msg.method === 'tools/call') {
    const args = (msg.params && msg.params.arguments) || {};
    const bootstrap = new Bootstrap({
      deviceName: args.host || process.env.QTQAENGINE_HOST || '127.0.0.1',
      qtqaenginePort: Number(args.port || process.env.QTQAENGINE_PORT || 8900),
      qtqaengineTimeout: Number(args.timeout || process.env.QTQAENGINE_TIMEOUT || 30000),
    });
    await bootstrap.start();
    try {
      const value = await bootstrap.sendAction(args.action, args.params || []);
      return { content: [{ type: 'text', text: JSON.stringify(value) }] };
    } finally {
      await bootstrap.shutDown();
    }
  }
  throw new Error(`unknown method ${msg.method}`);
}

function main() {
  let buf = Buffer.alloc(0);
  let queue = Promise.resolve();
  const write = (obj) => process.stdout.write(frame(obj));

  const dispatch = (msg) => {
    if (msg.id === undefined || msg.id === null) {
      return;
    }
    queue = queue.then(async () => {
      try {
        write({ jsonrpc: '2.0', id: msg.id, result: await handle(msg) });
      } catch (err) {
        write({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32000, message: String(err && err.message ? err.message : err) },
        });
      }
    });
  };

  process.stdin.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      const headerEnd = buf.indexOf('\r\n\r\n');
      if (headerEnd < 0) {
        return;
      }
      const header = buf.slice(0, headerEnd).toString('utf8');
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        return;
      }
      const len = Number(match[1]);
      const start = headerEnd + 4;
      if (buf.length < start + len) {
        return;
      }
      const body = buf.slice(start, start + len).toString('utf8');
      buf = buf.slice(start + len);
      try {
        dispatch(JSON.parse(body));
      } catch (err) {
        write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } });
      }
    }
  });
}

export { main, handle };
export default main;
