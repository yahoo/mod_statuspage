/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/*
 * This Example shows how monitr, proces-watcher and mod-statuspage works together.
 * process-watcher needs to be started as a separate process.
 * It also shows one of the ways to set clusterStartTime on the worker process.
 */

var cluster = require('cluster'),
    http = require('http'),
    express = require('express'),
    monitor = require('monitr'),
    statuspage = require('../lib/index.js'),
    numWorker = require('os').cpus().length > 1 ? require('os').cpus().length : 2,
    clusterStartTime = Date.now(),
    newWorkerEnv = {};

if (cluster.isMaster) {
    var i;
    newWorkerEnv.clusterStartTime = clusterStartTime;

    for (i = 0; i < numWorker; i++) {
        console.log("Starting worker: " + i);
        cluster.fork(newWorkerEnv);
    }

    cluster.on('exit', function (worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
        cluster.fork(newWorkerEnv);
    });

} else {
    //Worker Process
    monitor.start();
    if (process.env.clusterStartTime) {
        process.clusterStartTime = new Date(parseInt(process.env.clusterStartTime,10));
    }

    process.on('exit', function () {
        monitor.stop();
    });

    process.on('SIGINT', function () {
        process.exit();
    });

    var app = express();
    app.use(statuspage({
        url: '/status'
    }));

    console.log('Go to: http://127.0.0.1:8000/status');
    app.listen(8000);
}
