# Changelog

## 4.6.0 - 2017-01-10

* Add position sticky for controls. May be helpfull for big reference images

## 4.5.0 - 2016-11-02

* Add ability to run sets specified in config

## 4.4.0 - 2016-10-20

* Add "copy to clipboard" and "view in browser" buttons. You can copy suite name and open suite url in browser with one click now

## 4.3.5 - 2016-10-06

* Replace `q` and `q-io` with `bluebird` and `fs-extra`. `Array.prototype` will not be overriden now

## 4.3.4 - 2016-09-30

* Fixed bug with displaying of test url in meta-info

## 4.3.3 - 2016-09-13

* Remove unnecessary output while finding global gemini

## 4.3.2 - 2016-08-31

* Fixed bug with infinity pending of tests in html reporter

## 4.3.1 - 2016-08-25

* Fixed passing of the 'grep' value

## 4.3.0 - 2016-08-23

* Emit updateResult event during update for optimize reference image in plugin

## 4.2.1 - 2016-08-23

* Fixed bug with passing config path through `--config` option

## 4.2.0 - 2016-07-28

* Supported displaying of test url and session id in meta-info of HTML reporter.

## 4.1.0 - 2016-07-15

* Supported option `--browser`.

## 4.0.0 - 2016-04.20

* Support gemini@4.x (@sipayrt)

## 3.0.0 - 2016-03.23

* Switch to gemini@3.x (@j0tunn)

## 2.2.1 - 2016-02-25

Fix: retry button enabled correctly after retrying single test (@SwinX)

## 2.2.0 - 2016-02-24

* Redesigned action buttons - now they are located at the top of test block near background buttons. Also accept button now works for both cases - accepting new reference and replace existing. (@SwinX)
* Added possibility to retry any test, even successful (@SwinX)
* Removed 'uncaughtException' handler from code. (@SwinX)

## 2.1.1 - 2016-02-03

Fix: reference images for new suites saved correctly (@SwinX)

## 2.1.0 - 2016-01-29

* Added `--grep` option. Searches suites by full name. (@SwinX)
* Added possibility to save missing reference images (@SwinX)
* Added `Retry` button to all failed tests. Added `Retry all` button to retry all failed tests (@SwinX)
* Added tooltip for `replace` button. (@pazone)
* Run button now has yellow color (@pazone)

## 2.0.0 - 2015-12-20

* Switch to gemini@2.x (@j0tunn).

## 0.3.2 - 2015-11-02

* Correctly mark tests from different suite paths in html-report (@sipayrt).
* Add ability to pass arguments to gemini config (@sipayrt).
* Run tests only in browsers from sets (@sipayrt).

## 0.3.1 - 2015-10-06

* Update `gemini` version to v1.0.0 (@sipayrt).

## 0.3.0 - 2015-08-22

* Work with `gemini` 0.13.x (@j0tunn).

## 0.2.3 - 2015-07-15

* Added fix for circular JSON(@twolfson).

## 0.2.2 - 2015-05-21

* Work with `gemini` 0.12.x (@SevInf).

## 0.2.1 - 2015-04-18

* Work with `gemini` 0.11.x (@SevInf).

## 0.2.0 - 2015-04-17

* Work with `gemini` 0.10.x (@SevInf).
* Allow to choose color of background in image boxes (@unlok).
* Correctly update title colors of a parent nodes when replacing
  the image (j0tunn).

## 0.1.3 - 2015-02-03

* Ability to specify the hostname (@i-akhmadullin).

## 0.1.2 - 2014-10-24

* Work with `gemini` 0.9.x

## 0.1.1 - 2014-10-01

* Show correct reference image after replacing it with current.

## 0.1.0 - 2014-09-30

Inital release. It is almost like HTML report, but updates in real-time
and allows you to selectively update reference images.
