# Gemini GUI

[![Build Status](https://travis-ci.org/gemini-testing/gemini-gui.svg)](https://travis-ci.org/gemini-testing/gemini-gui)

GUI for [gemini](https://github.com/gemini-testing/gemini) utility.

![screenshot](assets/screenshot.png "Screenshot")

## Installation

Install globally with `npm`:

```
npm i -g gemini-gui
```

## Running

To be able to use `GUI` on a project you must have `gemini` installed
locally in this project. `GUI` will not work with `gemini` below
`2.0.0`.

Run in the project root:

`gemini-gui ./path/to/your/tests`

Web browser with `GUI` loaded will be opened automatically.


## Options

* `-V`, `--version` – output the version number
* `-b`, `--browser <browser>` – run test only in the specified browser
* `-p`, `--port <port>` – port to launch server on
* `-h`, `--hostname <hostname>` – hostname to launch server on
* `-c, --config <file>` – gemini config file
* `-g, --grep <pattern>` – run only suites matching the pattern
* `-s`, `--set <set>` – set to run
* `-a`, `--auto-run` – auto run immediately
* `-O`, `--no-open` – not to open a browser window after starting the server
* `-h`, `--help` – output usage information

Also you can override gemini config options via environment variables and CLI options. See gemini [documentation](https://github.com/gemini-testing/gemini#configuration) for details.
