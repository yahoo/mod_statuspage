mod_statuspage for Node
===================

Simple express/connect middleware to provide a status page with following details of the nodejs host.

   * Various Versions - Prints NodeJS Version, OS Version, OS Release
   * CPU - Average Load on CPU
   * Memory - Total Memory, Free Memory
   * Traffic - Total Num of Requests, Requests per second, Total KBs Transferred, Total KBs Out etc.
   * Workers - List all the worker processes and the information listed above for each of the worker processes
   
This module reads the above data from a unix socket generated from the npm module process-watcher.
For more details on process-watcher, please refer https://github.com/yahoo/process-watcher.

This module is recommended to be used only in a cluster environment. Also this module is designed to
work together with monitr (https://github.com/yahoo/monitr) and process-watcher. For an example of them
working together please check examples/sample_cluster.js.

Installation
------------

`npm install mod_statuspage`

Usage
-----

```javascript
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
    responseContentType : 'html'
}));

console.log('Go to: http://127.0.0.1:8000/status');
app.listen(8000);
```

Configuration
-------------

   * `url` - The URL to respond to, defaults to `/status` 
   * `check` - A function to check the request to see if the status page should be shown. Default: `returns true to always show`
   * `responseContentType` - The Content-Type of the Response, can be html or json, defaults to `html`
   * `ejsTemplate` - EJS Template file for html rendering if responseContentType is html, defaults to `status.ejs` bundled with the module
   * `socketPath` - The socket path written by watchr, defaults to `/tmp/watcher.sock`
   


Build Status
------------

[![Build Status](https://secure.travis-ci.org/yahoo/mod_statuspage.png?branch=master)](http://travis-ci.org/yahoo/mod_statuspage)


Node Badge
----------

[![NPM](https://nodei.co/npm/mod_statuspage.png)](https://nodei.co/npm/mod_statuspage/)
