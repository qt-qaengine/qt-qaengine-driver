// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Andrei Kozhevnikov <coderusinbox@gmail.com>

import log from './logger';
import {server as baseServer, routeConfiguringFunction} from 'appium/driver';
import {QtQaEngineDriver} from './driver';

async function startServer(port, hostname) {
  const d = new QtQaEngineDriver();
  const server = await baseServer({
    routeConfiguringFunction: routeConfiguringFunction(d),
    port,
    hostname,
  });
  log.info(`QtQaEngineDriver server listening on http://${hostname}:${port}`);
  return server;
}

export {startServer};