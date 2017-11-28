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

* `--config`, `-c` - specify config file to use.
* `--port`, `-p` - specify port to run `GUI` backend on.
* `--hostname`, `-h` - specify hostname to run `GUI` backend on.
* `--root-url`, `-r` - use specified URL, instead of `rootUrl` setting from config file.
* `--grid-url` - use specified URL, instead of `gridUrl` setting from config file.
* `--screenshots-dir`, `-s` - use specified directory, instead of `screenshotsDir` setting
from config.
* `--grep`, `-g` - find suites by name. Note that if some suite files specified search will be done
only in that files.
* `--debug` - enable debug mode (verbose logging).
* `--auto-run`, `-a` - run gemini immediately (without pressing `run` button).
* `--set`, `-s` - run set specified in config.
* `--no-open`, `-O` - not to open a browser window after starting the server.
* `--reuse` - filepath to gemini tests results directory OR url to tar.gz archive to reuse
* `--reuse-request-timeout` - request timeout in milliseconds (for downloading tar.gz archive to reuse)

You can also override config file options with environment variables. Use `gemini`
[documentation](https://github.com/gemini-testing/gemini#configuration) for details.
