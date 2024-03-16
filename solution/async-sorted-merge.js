"use strict";

const Heap = require('heap');
const _ = require('lodash');

// Print all entries, across all of the *async* sources, in chronological order.

const BUFFER_SIZE = 100; // TODO: Tune this value
module.exports = async (logSources, printer) => {
  const heap = new Heap((a, b) => a.date - b.date);
  const sourceBuffers = logSources.map(() => []);

  async function fillBuffer(sourceIndex) {
    if (logSources[sourceIndex].drained) {
      return;
    }

    let promises = _.times(BUFFER_SIZE, () => logSources[sourceIndex].popAsync());
    const { fulfilled, rejected } = _.groupBy(await Promise.allSettled(promises), 'status');
    const logs = fulfilled.filter(res => !!res.value).map(res => res.value);

    if (logs.length > 0) {
      heap.push({ sourceIndex, ...logs[0] });
      sourceBuffers[sourceIndex] = logs.slice(1);
    }
  }

  const promises = [];
  for (let s = 0; s < logSources.length; s++) {
    promises.push(fillBuffer(s));
  }
  await Promise.all(promises);

  while (!heap.empty()) {
    const { sourceIndex, ...log } = heap.pop();
    printer.print(log);

    if (sourceBuffers[sourceIndex].length > 0) {
      heap.push({ sourceIndex, ...sourceBuffers[sourceIndex].shift() });
    } else {
      await fillBuffer(sourceIndex);
    }
  }

  printer.done();

  return console.log("Async sort complete.")
};
