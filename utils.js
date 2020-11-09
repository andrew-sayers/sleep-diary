/*
 * Copyright (C) 2020 Andrew Sayers
 * See LICENSE.txt for license information.
 */

var username, start_time, day_length, target_timestamp, target_active, server_url, server_active;

/*
 * Update values that might be changed by another window
 */
function update_utils() {

    username         = location.search.replace( new RegExp('^\\?(?:.*?&)?username=([^&]*).*$'),"$1") || '';

    start_time       = parseInt( localStorage.getItem('value ' + username + ':now'), 10 ) || new Date().getTime() - 100; // subtract 100 to make sure update_ago() sets the right time even if it runs a millisecond too early
    day_length       = parseInt( localStorage.getItem('value ' + username + ':day-length'), 10 ) || 25*60*60000; // 25 hours exactly

    target_timestamp = parseInt( localStorage.getItem('value ' + username + ':target-timestamp'), 10 ) || new Date().getTime();
    target_active    = localStorage.getItem('value ' + username + ':target-active') || false;

    server_url       = localStorage.getItem('value ' + username + ':server-url') || '';
    server_active    = localStorage.getItem('value ' + username + ':server-active') || false;
}
document.addEventListener( "visibilitychange", function() {
    if ( document.visibilityState == 'visible' ) update_utils();
});
update_utils();

// Convert e.g. "1" to "01":
function zero_pad(values) {
    for ( var n=0; n!=values.length; ++n ) {
        if ( values[n] < 10 ) values[n] = '0' + values[n];
    }
    return values;
}

// Convert a Unix timestamp to a pretty-printed date:
function format_date(time) {
    var date = new Date(time);
    return zero_pad([
        date.getFullYear(),
        date.getMonth()+1,
        date.getDate()
    ]).join('-');
}

// Convert a Unix timestamp to a pretty-printed time:
function format_time(time) {
    var date = new Date(time);
    return zero_pad([
        date.getHours(),
        date.getMinutes()
    ]).join(':');
}

// Convert a duration in milliseconds to hours and minutes:
function format_duration(duration) {
    return zero_pad([
        Math.floor( duration         /3600000), // hours
        Math.floor((duration%3600000)/  60000)  // minutes
    ]).join(':');
}
