/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
var url = require('url'),
    ejs = require('ejs'),
    fs = require('fs'),
    watcher = require('./watcher'),
    ejsStr;


module.exports = function (config) {

    config = config || {};
    config.url = config.url || '/status';
    config.socketPath = config.socketPath || '/tmp/watcher.sock';
    config.errMessage = config.errMessage || 'Not Found';
    config.errStatus = config.errStatus || 404;
    config.responseContentType = config.responseContentType || 'html';//valid values are html or json
    if (config.responseContentType !== 'json') {  //if not json response will be in html
        config.ejsTemplate = config.ejsTemplate || __dirname + '/status.ejs';
        ejsStr = fs.readFileSync(config.ejsTemplate, 'utf8');
    }

    return function (req, resp, next) {
        if (url.parse(req.url).pathname === config.url) {
            if (typeof config.check !== "function" || config.check(req)) {
                watcher(config.socketPath, function (err, data) {
                    if (err) {
                        // how do you diagnose a real errwatcherDataor?
                        resp.writeHead(500, {
                            'Content-Type' : 'text/plain'
                        });
                        resp.end("Watcher is not running");
                    } else if (config.responseContentType === 'json') {
                        resp.writeHead(200, {
                            'Content-Type' : 'application/json'
                        });
                        resp.end(JSON.stringify(data));
                    } else {
                        resp.writeHead(200, {
                            'Content-Type' : 'text/html'
                        });
                        resp.end(ejs.render(ejsStr, data));
                    }
                });
            } else {
                resp.writeHead(config.errStatus, {
                    'Content-Type' : 'text/plain'
                });
                resp.end(config.errMessage);
            }
        } else {
            next();
        }
    };
};
