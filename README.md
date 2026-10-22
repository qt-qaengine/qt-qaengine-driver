# qt-qaengine-driver

Appium 2 driver and MCP server for [qt-qaengine](https://github.com/CODeRUS/qt-qaengine). Both clients open the engine socket, send the protocol hello, then send actions. They do not launch the application under test and they do not embed the library. The Qt process must already be listening.

The npm package name is `appium-qt-qaengine-driver`. The Appium driver name is `qtqaengine`.

## Projects

| Project | Role |
| --- | --- |
| [qt-qaengine](https://github.com/CODeRUS/qt-qaengine) | In-process library. Listens on the socket. |
| [qt-qaengine-inspector](https://github.com/CODeRUS/qt-qaengine-inspector) | Desktop inspector for the same socket. |
| [qt-qaengine-driver](https://github.com/CODeRUS/qt-qaengine-driver) | This package. |

The wire format is documented with the engine: [protocol](https://github.com/CODeRUS/qt-qaengine/blob/master/docs/protocol.md). This driver does not accept the old `Socket` automation name or the `systemPort` capability.

## Requirements

- Node.js, current enough for Appium 2
- Appium 2.15 or newer if you use the driver
- A process with [qt-qaengine](https://github.com/CODeRUS/qt-qaengine) loaded and a window the engine can attach to

`initialize` fails with `no platform!` when the process has no Qt Quick or Qt Widgets platform. The hello handshake can still succeed.

## Build and install the driver

From a clone. `npm install` installs Appium 2 as a devDependency. Run the Appium commands in this directory. Appium then uses this clone as its home and records the driver in `node_modules/.cache/appium/extensions.yaml`.

```bash
npm install
npm run build
npx appium driver install --source=local .
npx appium driver list --installed
npx appium --address 0.0.0.0 --port 4723
```

`npm run build` transpiles `lib/` into `build/`. Appium loads `build/index.js` from the installed package. The local install path is this clone (`node_modules/appium-qt-qaengine-driver`, `file:.`), so a later `npm run build` updates the code the running server will load after a restart.

If install reports that `qtqaengine` is already installed:

```bash
npx appium driver uninstall qtqaengine
npx appium driver install --source=local .
```

Appium 2.19 can warn that this package has no peer dependency on Appium. The driver still loads when `driver list` shows `qtqaengine@1.0.0` and the server log says `QtQaEngineDriver has been successfully loaded`.

Create a session only after the Qt process is already listening. The session sends `hello`, then `initialize`.

## Capabilities

| Capability | Value |
| --- | --- |
| `platformName` | `QtQaEngine` |
| `automationName` | `QtQaEngine` |
| `deviceName` | Host of the engine socket. Default `127.0.0.1`. |
| `qtqaenginePort` | TCP port. Default `8900`. |
| `qtqaengineTimeout` | Socket timeout in milliseconds. |

`deviceName` is the hostname, not a device id. An Appium command that this class does not implement is forwarded as an engine action of the same name. The engine answers `not_implemented` with status 405 when the current platform has no such command.

```python
from appium import webdriver
from appium.options.common.base import AppiumOptions

options = AppiumOptions()
options.platform_name = "QtQaEngine"
options.automation_name = "QtQaEngine"
options.set_capability("deviceName", "127.0.0.1")
options.set_capability("qtqaenginePort", 8900)
options.set_capability("qtqaengineTimeout", 5 * 60 * 1000)

driver = webdriver.Remote("http://localhost:4723", options=options)
```

The same session setup is in [example/example.py](example/example.py).

## MCP server

The stdio server speaks MCP `2024-11-05` with `Content-Length` framing. After `npm run build` the executable name is `qt-qaengine-mcp` (`build/mcp.js`). It exposes one tool, `qtqaengine_action`.

| Argument | Meaning |
| --- | --- |
| `action` | Engine action name. Required. |
| `params` | Array of action parameters. Default `[]`. |
| `host` | Engine host. Overrides `QTQAENGINE_HOST`. Default `127.0.0.1`. |
| `port` | Engine port. Overrides `QTQAENGINE_PORT`. Default `8900`. |
| `timeout` | Socket timeout in milliseconds. Overrides `QTQAENGINE_TIMEOUT`. Default `30000`. |

Each tool call opens a socket, sends `hello` and `initialize`, sends the action, and closes the socket.

`appium driver install` does not register this process. Start it only after `npm run build`.

A client starts it as a stdio process. From a clone that is not on `PATH`, the command is `node` and the argument is the absolute path of `build/mcp.js`.

Cursor reads `%USERPROFILE%\.cursor\mcp.json` on Windows and `~/.cursor/mcp.json` elsewhere. Add a server entry and restart that MCP server in the client after saving the file:

```json
{
  "mcpServers": {
    "qt-qaengine": {
      "command": "node",
      "args": ["C:\\path\\to\\qt-qaengine-driver\\build\\mcp.js"],
      "env": {
        "QTQAENGINE_HOST": "127.0.0.1",
        "QTQAENGINE_PORT": "8900"
      }
    }
  }
}
```

`QTQAENGINE_PORT` must be the port of the process that has qt-qaengine loaded. The library default is 8900. A test harness that sets another port, such as 8888, needs the same value here and in `qtqaenginePort`. The server does not launch the application and does not inject the library.

## License

Noncommercial use is under [PolyForm Noncommercial 1.0.0](LICENSE).

[OPEN_SOURCE_GRANT](OPEN_SOURCE_GRANT) is a separate permission. It lets you install, copy, and run this software to develop and test a program that is publicly available under an OSI-approved license or an FSF free-software license. A company may use that permission. It does not cover a proprietary program, including a proprietary program in the same repository or the same CI job. It does not allow shipping this software inside a product, and it does not allow relicensing it under the other program's license.

Copyright (c) 2026 Andrei Kozhevnikov. The required notice is in [NOTICE](NOTICE).

## Commercial Licensing

Using this driver in commercial products requires a separate license. Contact me at [coderus@duck.com](mailto:coderus@duck.com) and on Telegram at [https://t.me/icoderus](https://t.me/icoderus) to discuss pricing and terms. I also provide paid services for integrating automated tests into your infrastructure.
