'use strict';
const readdir = require('recursive-readdir');
const { allPass, test, complement, filter, pipe, map, split, groupBy, prop, sort, comparator, lt } = require('ramda');
const { readFileSync } = require('fs');

module.exports = { getTestCases };

async function getTestCases(folder) {
  return pipe(
    filter(filterCases),
    sort(comparator(lt)),
    map(splitParts),
    map(createTest),
    groupBy(prop('method')),
  )(await readdir(folder));
}

function filterCases(path) {
  return allPass([test(/\.json$/), complement(test(/\/\./))])(path);
}

function splitParts(path) {
  const [, group, file] = split('/', path);
  const [method] = split('-', file);
  return { group, method, path, file };
}

function createTest({ path, ..._ }) {
  return { test: JSON.parse(readFileSync(path)), ..._ };
}
