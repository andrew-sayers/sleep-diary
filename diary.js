/*
 * Copyright (C) 2020 Andrew Sayers
 * See LICENSE.txt for license information.
 */

var day_time   = document.getElementById('day-time'),
    night_time = document.getElementById('night-time'),
    times      = document.getElementById('guidance'),
    time_list  = document.getElementById('time-list'),
    sleep_time,
    wake_time,
    sleep_log,
    send_state = 0
    ;

/*
 * Update values that might be changed by another window
 */
function update_index() {
    sleep_time = parseInt( localStorage.getItem('value ' + username + ':sleep'), 10 );
    wake_time  = parseInt( localStorage.getItem('value ' + username + ':wake'), 10 );
    sleep_log  = localStorage.getItem('name:' + username) || '';
}
update_index();

document.body.className = localStorage.getItem('value ' + username + ':time') || '';
document.getElementById('tools').setAttribute( 'href', 'tools.html?username=' + username );

/*
 * Regularly update the user interface
 */
function update_ago() {
    if ( !isNaN(sleep_time) ) {
        night_time.innerHTML = format_duration( new Date().getTime() - sleep_time ) + ' ago';
    }
    if ( !isNaN(wake_time) ) {
        day_time.innerHTML   = format_duration( new Date().getTime() -  wake_time ) + ' ago';
    }
    save_to_server(false);
}
update_ago();
setInterval(update_ago, 60000 );
document.addEventListener( "visibilitychange", function() {
    if ( document.visibilityState == 'visible' ) {
        update_index();
        update_guidance();
        update_ago();
    }
});

/*
 * Send data to the server, if a server has been configured
 */
function save_to_server(force) {
    if ( server_active && ( force || send_state == 2 ) ) {

        var req = new XMLHttpRequest(),
            sleep_log_length = sleep_log.length // avoid race conditions with events coming in asynchronously
        ;

        send_state = 1;

        // save the data on the server:
        req.onload = function(e) {
            send_state = 0;
            localStorage.setItem('sent:'+username, sleep_log_length);
        };
        req.onerror = function(e) {
            send_state = 2;
        }
        req.open( "GET", server_url + '?username='+username+'&log='+sleep_log.substr( localStorage.getItem('sent:'+username)||0 ) );
        req.send();

    }
}

/*
 * Add a sleep/wake event to the event log
 */
function add_event(name) {

    var now = new Date().getTime();

    // save the event:
    sleep_log += [
        now,
        name,
        target_active,
        target_timestamp,
        'v1_' // version string/end-of-record marker
    ].join('_');

    localStorage.setItem('name:'+username, sleep_log);

    save_to_server(true);

    return now;

}

/*
 * Update the guidance for waking up at a target date/time
 */
function update_guidance() {
    if ( target_active && target_timestamp > start_time ) {
        times.removeAttribute('style');
        var time_remaining   = target_timestamp - start_time,
            days_remaining   = time_remaining / day_length
        ;
        time_list.innerHTML = [
            Math.ceil (days_remaining),
            Math.floor(days_remaining)
        ].map(function(days) {
            if ( days <= 0 ) {
                return '';
            } else {
                var day_length = time_remaining/days;
                return '<tr><td>' + (sleep_time?format_time(sleep_time+day_length):'') + '<td>' + days + '<td>' + format_duration(day_length) + '</tr>'
            }
        }).join('');
    } else {
        times.setAttribute('style','display:none');
    }
}
update_guidance();

/*
 * Handle clicks on the day/night buttons
 */
document.getElementById('day').addEventListener( 'click', function submit(event) {
    localStorage.setItem('value ' + username + ':now' , start_time = add_event('day') );
    localStorage.setItem('value ' + username + ':time', document.body.className = 'day' );
    localStorage.setItem('value ' + username + ':wake', wake_time = start_time );
    update_guidance();
    update_ago();
});
document.getElementById('night').addEventListener( 'click', function submit(event) {
    localStorage.setItem('value ' + username + ':now'  , start_time = add_event('night') );
    localStorage.setItem('value ' + username + ':time' , document.body.className = 'night' );
    localStorage.setItem('value ' + username + ':sleep', sleep_time = start_time );
    update_guidance();
    update_ago();
});
