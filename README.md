# Appium Socket Driver

## Building

### Prerequisites

Install Node.js (LTS or newer):

- **macOS** — via [Homebrew](https://brew.sh):

  ```
      brew install node
  ```

- **Windows** — via [winget](https://learn.microsoft.com/windows/package-manager/winget/) (or download the installer from [nodejs.org](https://nodejs.org)):

  ```
      winget install OpenJS.NodeJS.LTS
  ```

### Build

Install dependencies and build the driver:

```
    npm install
    npm run build
```

Install the driver into Appium and start the server:

```
    npx appium driver install --source=local .
    npx appium
```

The server should report `SocketDriver has been successfully loaded` and list
`socket` under available drivers.

## Usage (python example)

Install `Appium-Python-Client` python module to work with Appium

