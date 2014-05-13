var os = require("os"),
    net = require("net"),
    bl = require("bl"),
    moment = require("moment");

module.exports = function (socketPath, _callback) {
    var socket = net.createConnection(socketPath),
        response_obj = {};

    // because there's a possibility of multiple calls from the events
    // ensure it can't trigger a double-callback
    function callback (err, data) {
        if (_callback) {
            _callback(err, data);
            _callback = null;
        }
    }

    function collector (err, data) {
        if (err) {
            return callback(err);
        }

        var statuses = JSON.parse(data.toString()),
            hasHealthInfo = false;
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
            var worker_json = {
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
                "start_time" : statuses[pid].curr.utcstart * 1000, //convert sec in millis
                "start_time_format" : moment.unix(statuses[pid].curr.utcstart).fromNow()
            };
            if (statuses[pid].curr.health_status_timestamp) {
                //convert sec in millis
                worker_json.health_status_timestamp = statuses[pid].curr.health_status_timestamp * 1000;
                worker_json.health_time_format = moment.unix(statuses[pid].curr.health_status_timestamp).fromNow();
                worker_json.health_is_down = statuses[pid].curr.health_is_down;
                worker_json.health_status_code = statuses[pid].curr.health_status_code;
                hasHealthInfo = true;
                if(!response_obj.latest_health_timestamp ||
                   statuses[pid].curr.health_status_timestamp > response_obj.latest_health_timestamp) {
                    response_obj.latest_health_timestamp = statuses[pid].curr.health_status_timestamp;
                    response_obj.latest_health_is_down = worker_json.health_is_down;
                }
            }
            response_obj.worker.push(worker_json);
            response_obj.total_requests = response_obj.total_requests + statuses[pid].curr.reqstotal;
            response_obj.total_kbs_transferred = response_obj.total_kbs_transferred + statuses[pid].curr.kb_trans;
            response_obj.total_kbs_out = response_obj.total_kbs_out + statuses[pid].curr.kbs_out;
            response_obj.total_rps = response_obj.total_rps + statuses[pid].curr.rps;
        });
        response_obj.has_health_info = hasHealthInfo;
        return callback(null, response_obj);
    }

    socket.pipe(bl(collector));
    socket.on("close", function (error) {
        if (error) {
            callback(error);
        }
    });
};