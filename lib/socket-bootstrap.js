// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Andrei Kozhevnikov <coderusinbox@gmail.com>

import net from 'net';
import _ from 'lodash';
import { errorFromCode } from 'appium-base-driver';
import log from './logger';


const COMMAND_TYPES = {
  ACTION: 'action',
  SHUTDOWN: 'shutdown'
};

class SocketBootstrap {
  constructor (opts) {
    this.opts = opts;
    this.ignoreUnexpectedShutdown = true;
  }

  async start () {
    await this.init();
    await this.connectSocket();
  }

  async shutDown () {
    // Do not send appDisconnect: after app:exit (or a dead app) the process
    // may never reply, and sendAction waits up to socketTimeout (often minutes).
    // Drop the TCP socket; session teardown must not block on the device.
    if (this.socketClient) {
      try {
        this.socketClient.removeAllListeners();
        this.socketClient.destroy();
      } catch (ign) {
        // ignore
      }
      this.socketClient = null;
    }
  }

  async connectSocket () {
    const port = this.opts.qtqaenginePort || 8900;
    const host = this.opts.deviceName || '127.0.0.1';
    log.debug(`connectSocket ${host}:${port}`);
    try {
      return await new Promise((resolve, reject) => {
        try {
          if (!this.socketClient) {
            this.socketClient = net.connect(port, host);
            this.socketClient.setEncoding('utf8');
            this.socketClient.on('error', (err) => {
              if (!this.ignoreUnexpectedShutdown) {
                throw new Error(`Bootstrap socket shutdown: ${err}`);
              } else {
                this.socketClient.destroy();
                this.socketClient = null;
                reject(err);
              }
            });
            this.socketClient.once('connect', () => {
              log.info("Bootstrap socket is now connected");
              this.sendHello()
                .then(() => this.sendAction("initialize"))
                .then(() => resolve())
                .catch(reject);
            });
          } else {
            log.info("SocketClient already Created");
            resolve();
          }
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      log.errorAndThrow(`Error occured while reconnection. Original error: ${err}`);
    }
  }

  async sendCommand (type, extra = {}) {
    if (!this.socketClient) {
      await this.connectSocket();
    }

    return new Promise((resolve, reject) => {
      let cmd = Object.assign({ cmd: type }, extra);
      let cmdJson = `${JSON.stringify(cmd)} \n`;
      let streamData = '';
      log.debug(`Sending command to device: ${cmdJson} with timeout ${this.opts.qtqaengineTimeout}`);

      try {
        this.socketClient.removeAllListeners('timeout');
        this.socketClient.removeAllListeners('end');
        this.socketClient.write(cmdJson);
        this.socketClient.on('data', (data) => {
          log.debug("Received command result from bootstrap : "+data);
          try {
            streamData = JSON.parse(streamData + data);
            this.socketClient.removeAllListeners('data');
            // Must use if/else: JSON value `false` is a valid success payload.
            if (streamData.status === 0) {
              resolve(streamData.value);
            } else {
              reject(errorFromCode(streamData.status));
            }
          } catch (ign) {
            log.debug("Stream still not complete, waiting");
            streamData += data;
          }
        });
        if (this.opts.qtqaengineTimeout) {
          this.socketClient.setTimeout(this.opts.qtqaengineTimeout);
          this.socketClient.on('timeout', () => {
            this.socketClient.destroy();
            this.socketClient = null;
            this.isRestartApp = true;
            reject(errorFromCode(-1, "No response from Server"));
          });
        }
        this.socketClient.on('end', () => {
          this.socketClient.destroy();
          this.socketClient = null;
          this.isRestartApp = true;
          reject(errorFromCode(-1, "Socket ended by Server"));
        });
      } catch (err) {
        reject(errorFromCode(-1, err));
      }
    });
  }

  readOne (extra = {}) {
    return new Promise((resolve, reject) => {
      let streamData = '';
      const onData = (data) => {
        try {
          const parsed = JSON.parse(streamData + data);
          this.socketClient.removeListener('data', onData);
          resolve(parsed);
        } catch (ign) {
          streamData += data;
        }
      };
      try {
        this.socketClient.removeAllListeners('timeout');
        this.socketClient.removeAllListeners('end');
        this.socketClient.write(`${JSON.stringify(extra)} \n`);
        this.socketClient.on('data', onData);
        if (this.opts.qtqaengineTimeout) {
          this.socketClient.setTimeout(this.opts.qtqaengineTimeout);
          this.socketClient.on('timeout', () => {
            this.socketClient.destroy();
            this.socketClient = null;
            reject(errorFromCode(-1, 'No response from Server'));
          });
        }
        this.socketClient.on('end', () => {
          this.socketClient.destroy();
          this.socketClient = null;
          reject(errorFromCode(-1, 'Socket ended by Server'));
        });
      } catch (err) {
        reject(errorFromCode(-1, err));
      }
    });
  }

  async sendHello () {
    const reply = await this.readOne({ cmd: 'hello', protocol: 1 });
    if (!reply || reply.protocol !== 1 || reply.product !== 'qt-qaengine') {
      throw new Error(`qt-qaengine handshake failed: ${JSON.stringify(reply)}`);
    }
    return reply;
  }

  async sendAction (action, params = {}) {
    let extra = { action, params };
    return this.sendCommand(COMMAND_TYPES.ACTION, extra);
  }

  async sendInputAction (action, params = []) {
    let extra = { action, params };
    await this.sendCommand(COMMAND_TYPES.ACTION, extra);
    return true
  }

  async shutdown () {
    if (this.socketClient) {
      this.socketClient.end();
      this.socketClient.destroy();
      this.socketClient = null;
    }
  }

  async init () {
    log.debug('bootstrap init');
  }

  set ignoreUnexpectedShutdown (ignore) {
    log.debug(`${ignore ? 'Ignoring' : 'Watching for'} bootstrap disconnect`);
    this._ignoreUnexpectedShutdown = ignore;
  }

  get ignoreUnexpectedShutdown () {
    return this._ignoreUnexpectedShutdown;
  }
}

export { SocketBootstrap, COMMAND_TYPES };
export default SocketBootstrap;
