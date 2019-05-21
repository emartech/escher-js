'use strict';

const sinon = require('sinon');

const timeDecorator = ({ timestamp }, cb) => (...args) => {
  const clock = sinon.useFakeTimers(timestamp);
  try {
    cb({ args, clock });
  } catch (e) {
    clock.restore();
    throw e;
  }
  clock.restore();
};

module.exports = { timeDecorator };
