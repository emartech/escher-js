'use strict';

const sinon = require('sinon');

const timeDecorator = ({timestamp}, cb) => (...args) => {
    const clock = sinon.useFakeTimers(timestamp);
    try {
        cb(...args);
    } finally {
        clock.restore();
    }
};

module.exports = {timeDecorator};
