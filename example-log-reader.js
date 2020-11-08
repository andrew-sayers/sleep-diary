#!/usr/bin/nodejs

/*
 * Copyright (C) 2020 Andrew Sayers
 * See LICENSE.txt for license information.
 */

const fs = require('fs');
const cook_data = require('./cook-data.js');

/*
 * Object containing logs for all available users
 */
var logs = {};

fs.readFileSync('access.log') // Change "access.log" to the path to your access log
    .toString()
    .match( /[^" ]*[?&]username=[^" ]*/g )
    .forEach( line => {

        // convert "username=foo&log=bar" to { username: 'foo', log: 'bar' }
        var log = {};
        line.match(/[?&][^&]*/g).forEach( kv => {
            kv = kv.match(/^.([^=]*)=(.*)$/);
            log[decodeURIComponent(kv[1])] = decodeURIComponent(kv[2]);
        });

        // parse a log message:
        if ( log.hasOwnProperty('username') && log.hasOwnProperty('log') ) {
            if ( !logs.hasOwnProperty(log.username) ) logs[log.username] = [];
            logs[log.username] = logs[log.username].concat(cook_data.parse(log));
        }

    });
;

// Convert the raw event data to high-level information about sleeps:
Object.keys(logs).forEach( username => logs[username] = cook_data.to_sleeps(logs[username]) );

// Print all logs:
console.log(JSON.stringify(logs));
