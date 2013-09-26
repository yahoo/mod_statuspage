/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
var url = require('url'),
    net = require('net'),
    os = require('os'),
    ejs = require('ejs'),
    fs = require('fs'),
    ejsStr;


module.exports = function (config) {

    config = config || {};
    config.url = config.url || '/status';
    config.socketPath = config.socketPath || '/tmp/watcher.sock';
    config.responseContentType = config.responseContentType || 'html';//valid values are html or json
    if (config.responseContentType !== 'json') {  //if not json response will be in html
        config.ejsTemplate = config.ejsTemplate || __dirname + '/status.ejs';
        ejsStr = fs.readFileSync(config.ejsTemplate, 'utf8');
    }

    return function (req, resp, next) {
        var socket,
            msg,
            response_obj = {},
            respond;
        if (url.parse(req.url).pathname === config.url) {
            respond = (config.check) ? config.check(req) : true;
            if (respond) {
                socket = net.createConnection(config.socketPath);
                msg = "";
                socket.on("data", function (data) {
                    msg += data;
                });
                socket.on("end", function () {
                    var statuses = JSON.parse(msg);
                    response_obj.hostname = os.hostname();
                    response_obj.node_version = process.version;
                    response_obj.os_type = os.type();
                    response_obj.os_release = os.release();
                    response_obj.currentTime = Date.now();
                    if (process.clusterStartTime) {
                        //Show Restart Time only if Process has the field clusterStartTime
                        //this attribute should be set by the cluster master process
                        response_obj.cluster_start_time = process.clusterStartTime.getTime();
                        response_obj.cluster_uptime = Math.round((new Date().getTime() - process.clusterStartTime.getTime()) / 1000);
                    }
                    response_obj.total_memory = os.totalmem();
                    response_obj.free_memory = os.freemem();
                    response_obj.os_loadavg = os.loadavg();
                    response_obj.worker = [];

                    response_obj.total_requests = 0;
                    response_obj.total_kbs_transferred = 0;
                    response_obj.total_kbs_out = 0;
                    response_obj.total_rps = 0;
                    Object.keys(statuses).forEach(function(pid) {
                        response_obj.worker.push({
                            "pid" : pid,
                            "cpu" : statuses[pid].curr.cpu,
                            "mem" : statuses[pid].curr.mem,
                            "cpu_per_req" : statuses[pid].curr.cpuperreq,
                            "jiffy_per_req" : statuses[pid].curr.jiffyperreq,
                            "rps" : statuses[pid].curr.rps,
                            "events" : statuses[pid].curr.events,
                            "open_conns" : statuses[pid].curr.oconns,
                            "open_requests" : statuses[pid].curr.oreqs,
                            "total_requests" : statuses[pid].curr.reqstotal,
                            "kbs_out" : statuses[pid].curr.kbs_out,
                            "kbs_transferred" : statuses[pid].curr.kb_trans,
                            "start_time" : statuses[pid].curr.utcstart * 1000 //convert sec in millis
                        });
                        response_obj.total_requests = response_obj.total_requests + statuses[pid].curr.reqstotal;
                        response_obj.total_kbs_transferred = response_obj.total_kbs_transferred + statuses[pid].curr.kb_trans;
                        response_obj.total_kbs_out = response_obj.total_kbs_out + statuses[pid].curr.kbs_out;
                        response_obj.total_rps = response_obj.total_rps + statuses[pid].curr.rps;
                    });
                    if (config.responseContentType === 'json') {
                        resp.writeHead(200, {
                            'Content-Type' : 'application/json'
                        });
                        resp.end(JSON.stringify(response_obj));
                    } else {
                        resp.writeHead(200, {
                            'Content-Type' : 'text/html'
                        });
                        resp.end(ejs.render(ejsStr, response_obj));
                    }
                });

                socket.on("error", function () {
                    resp.writeHead(500, {
                        'Content-Type' : 'text/plain'
                    });
                    resp.end("Watcher is not running");
                });

                socket.on("close", function (error) {
                    if (error) {
                        resp.writeHead(500, {
                            'Content-Type' : 'text/plain'
                        });
                        resp.end("Watcher is not running");
                    }
                });
            } else {
                resp.writeHead(404, {
                    'Content-Type' : 'text/plain'
                });
                resp.end('Not Found');
            }
        } else {
            next();
        }
    };
};
