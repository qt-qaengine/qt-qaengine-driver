// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Andrei Kozhevnikov <coderusinbox@gmail.com>

import {QtQaEngineDriver} from './lib/driver';
import {startServer} from './lib/server';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 4774;

async function main() {
  const getArgValue = (/** @type {string} */ argName) => {
    const argIndex = process.argv.indexOf(argName);
    return argIndex > 0 ? process.argv[argIndex + 1] : null;
  };
  const port = parseInt(String(getArgValue('--port')), 10) || DEFAULT_PORT;
  const host = getArgValue('--host') || DEFAULT_HOST;
  return await startServer(port, host);
}

export {QtQaEngineDriver, startServer, main};
export default QtQaEngineDriver;
