'use strict';

const readdir = require('recursive-readdir');
const {allPass, test, complement, filter, pipe, map, split, groupBy, prop} = require('ramda');
const {readFileSync} = require('fs');

const filterCases = allPass([test(/\.json$/), complement(test(/\/\./))]);

const splitParts = path => {
    const [, group, file] = split('/', path);
    const [method] = split('-', file);
    return {group, method, path};
};

const createTest = ({ path, ..._ }) => ({ test: JSON.parse(readFileSync(path)), ..._ });

const getTestCases = folder => readdir(folder)
    .then(pipe(
        filter(filterCases),
        map(splitParts),
        map(createTest),
        groupBy(prop('method'))
    ));

module.exports = { getTestCases };
