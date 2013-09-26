/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var express = require('express'),
    status = require('../lib/index.js');

var app = express();

app.use(status({
    url: '/status',
    check: function(req) {
        if (req.something == false) {
            return false; //Don't show status
        }
        return true; //Show status
    },
    responseContentType: 'json'
}));

console.log('Go to: http://127.0.0.1:8000/status');
app.listen(8000);



/*
 * Sample json output
 *
 {
   "hostname":"windowdistance.corp.yahoo.com",
   "node_version":"v0.10.18",
   "os_type":"Linux",
   "os_release":"2.6.18-164.el5",
   "currentTime":1379723936357,
   "cluster_start_time":1379723926367,
   "cluster_uptime":10,
   "total_memory":4140347392,
   "free_memory":360099840,
   "os_loadavg":[
      1.8544921875,
      2.4150390625,
      2.63525390625
   ],
   "worker":[
      {
         "pid":"28766",
         "cpu":0,
         "mem":0.37,
         "cpu_per_req":0,
         "jiffy_per_req":0,
         "rps":0,
         "events":2,
         "open_conns":0,
         "open_requests":0,
         "total_requests":0,
         "kbs_out":0,
         "kbs_transferred":0,
         "start_time":1379723926000
      },
      {
         "pid":"28768",
         "cpu":0,
         "mem":0.37,
         "cpu_per_req":0,
         "jiffy_per_req":0,
         "rps":0,
         "events":2,
         "open_conns":0,
         "open_requests":0,
         "total_requests":0,
         "kbs_out":0,
         "kbs_transferred":0,
         "start_time":1379723926000
      }
   ],
   "total_requests":0,
   "total_kbs_transferred":0,
   "total_kbs_out":0,
   "total_rps":0
}
 */
