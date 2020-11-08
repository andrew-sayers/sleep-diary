/*
 * Copyright (C) 2020 Andrew Sayers
 * See LICENSE.txt for license information.
 */

var ignore_repeat_events_within_this_duration = 30*60*1000;

var cook_data = {

    /*
     * parse a block of data
     *
     * This can be a complete set of "log" data from the browser,
     * or a single line from the server's access log.
     *
     * Returns an array of events.  An event is an object of the form:
     * {
     *   "now": 12345, // When the event occurred, in milliseconds past the epoch
     *   "time": 'day', // Which icon was pressed - "day" or "night"
     *   "target": 23456, // Target time when the icon was pressed (optional)
     * }
     */
    parse: function( data ) {
        if ( typeof data == 'string' || data instanceof String ) {
            data = { log: data };
        }
        var ret = [];
        if ( data.hasOwnProperty('log') ) {
            var log = data.log.split('_');
            var start=0;
            for ( var n=0; n!=log.length; ++n ) {
                if ( log[n].search(/^v[0-9]+$/) == 0 ) {
                    var keys;
                    switch ( log[n] ) {
                    case 'v0': // development version
                        keys = [ 'now', 'time', 'target-day', 'target-time', 'location' ];
                        break;
                    case 'v1': // first public version
                        keys = [ 'now', 'time', 'target-active', 'target' ];
                        break;
                    default:
                        throw "Please add support for version " + log[n] + " log";
                    }
                    if ( n-start != keys.length ) throw "Impossible: expected " + keys.length + " keys, got " + (n-start);
                    var extra = {};
                    for ( var m=0; m!=keys.length; ++m ) {
                        extra[keys[m]] = log[start+m];
                    }
                    start=n+1;
                    ret.push(extra);
                }
            }
            delete data.log;
        }

        for ( var n=0; n!=ret.length; ++n ) {
            var r = ret[n];
            ['now','target'].forEach( key => {
                if ( r.hasOwnProperty(key) ) r[key] = parseInt(r[key],10) || null;
            });
            if ( r.hasOwnProperty('target-day') && r.hasOwnProperty('target-time') ) {
                if ( r['target-day'] == '' && r['target-time'] == '' ) {
                    delete r.target;
                } else {
                    // modern browsers can parse dates like "YYYY-MM-DD HH:MM", but some older browsers need "MM/DD/YYYY HH:MM":
                    var day = r['target-day'].split('-');
                    r['target'] = new Date(day[1] + '/' + day[2] + '/' + day[0] + ' ' + r['target-time']).getTime();
                }
                delete r['target-day'];
                delete r['target-time'];
            } else if ( r.hasOwnProperty('target-active') ) {
                if ( r['target-active'] == 'false' ) delete r.target;
                delete r['target-active'];
            }
        }
        return ret;
    },

    /*
     * convert a block of data to an array of sleeps
     *
     * A "sleep" usually covers the period between times the moon icon is pressed.
     * But in some cases, it tries to clear up obvious problems with the data.
     * For example if the user appears to have slept for 32 hours,
     * we assume they just forgot to use the site one day.
     *
     * Returns an array of sleeps.  A sleep is an object of the form:
     * {
     *   sleep_time: 12345, // when the user pressed the "moon" icon (optional)
     *   wake_time: 12346, // when the user pressed the "sun" icon (optional)
     *   sleep: {...}, // raw sleep event (optional)
     *   wake:  {...}, // raw wake event (optional)
     *   target: 23456, // target wake date/time when the moon icon was pressed
     *   disruptions: [
     *     // events that occur during night time, but are neigther "sleep" nor "wake".
     *     // This is not currently used, but could record e.g. periods of sleeplessness
     *   ],
     * }
     *
     */
    to_sleeps: function( records ) {

        if ( typeof records == 'string' || records instanceof String || records.hasOwnProperty('log') ) {
            records = cook_data.parse(records)
        }
        records = records.sort(function(a,b) { return (a.now||0) - (b.now||0); });

        // remove records without timestamps and merge duplicate records:
        var deduped_records = [ {now:-1} ];
        for ( var n=0; n!=records.length; ++n ) {
            var r = records[n];
            if ( r.now ) {
                if (
                    // records are not duplicates if they have different timestamps...
                    deduped_records[deduped_records.length-1].now != r.now &&
                    (
                        // and have different meanings or are more than a minute apart:
                        r.now - deduped_records[deduped_records.length-1].now > ignore_repeat_events_within_this_duration ||
                        r.time != deduped_records[deduped_records.length-1].time
                    )
                ) {
                    deduped_records.push({});
                }
                for ( var key in r ) if ( r.hasOwnProperty(key) ) {
                    deduped_records[deduped_records.length-1][key] = r[key];
                }
            }
        }

        // construct the output array:
        var one_hour = 60*60*1000, // constant value added for readability
            sleeps = [{ disruptions: [] }] // dummy value used during processing, deleted below
        ;

        for ( var n=1; n!=deduped_records.length; ++n ) {

            var r = deduped_records[n],
                prev_sleep = sleeps[sleeps.length-1],
                push = false;

            switch ( r.time ) {

            case 'day':
                // add a new sleep if the day would otherwise be absurdly long:
                if ( prev_sleep.wake_time ) {
                    push = prev_sleep.wake_time+one_hour < r.now;
                } else if ( prev_sleep.sleep_time ) {
                    push = prev_sleep.sleep_time+(18*one_hour) < r.now;
                } else {
                    push = true;
                }
                if (push) sleeps.push(prev_sleep = { disruptions: [] });
                prev_sleep.wake_time = r.now;
                prev_sleep.wake = r;
                break;

            case 'night':
                // add a new sleep if the day would otherwise be absurdly long:
                if ( prev_sleep.sleep_time ) {
                    push = prev_sleep.wake_time+(1*one_hour) < r.now;
                } else if ( prev_sleep.wake_time ) {
                    push = prev_sleep.wake_time+(6*one_hour) < r.now;
                } else {
                    push = true;
                }
                if (push) sleeps.push(prev_sleep = { disruptions: [] });
                prev_sleep.sleep_time = r.now;
                prev_sleep.sleep = r;
                if ( r.hasOwnProperty('target') ) {
                    prev_sleep.target = r.target;
                } else {
                    delete prev_sleep.target;
                }
                break;

            default:
                if ( !prev_sleep.wake_time ) {
                    // haven't woken up yet
                    prev_sleep.disruptions.push(r);
                }

            }

        }

        // remove the leading dummy value:
        sleeps.shift();

        return sleeps;

    }

};



if (typeof module !== 'undefined' && module.exports) {
    module.exports = cook_data;
}
