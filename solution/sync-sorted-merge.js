"use strict";

const Heap = require('heap');

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  const heap = new Heap((a, b) => a.date - b.date);
  for (let i = 0; i < logSources.length; i++) {
    const log = logSources[i].pop();
    if (log) {
      heap.push({ sourceIndex: i, ...log});
    }
  }

  while (heap.size() > 0) {
    const { sourceIndex, ...log } = heap.pop();
    printer.print(log);

    const nextLog = logSources[sourceIndex].pop();
    if (nextLog) {
      heap.push({ sourceIndex, ...nextLog });
    }
  }

  printer.done();

  return console.log("Sync sort complete.");
};
