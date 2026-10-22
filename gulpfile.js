// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) 2026 Andrei Kozhevnikov <coderusinbox@gmail.com>

'use strict';

const gulp = require('gulp');
const boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

boilerplate({
  build: 'appium-qt-qaengine-driver',
  testTimeout: 15000,
  watchE2E: true,
});
