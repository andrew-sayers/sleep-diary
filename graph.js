/*
 * Copyright (C) 2020 Andrew Sayers
 * See LICENSE.txt for license information.
 */

function fix_sleep_data(sleeps) {

    // STEP ONE: calculate the trimmed mean:
    var sleep_durations = [];
    for ( var n=0; n!=sleeps.length; ++n ) {
        var sleep = sleeps[n];
        if ( sleep.wake_time && sleep.sleep_time ) {
            sleep_durations.push( sleep.wake_time - sleep.sleep_time );
        }
    }
    sleep_durations = sleep_durations.sort();
    sleep_durations = sleep_durations.slice( Math.floor(sleep_durations.length/10), Math.floor(sleep_durations.length/10)*8 );
    if ( !sleep_durations.length ) return [];
    var average_sleep_duration = sleep_durations.reduce(function(a,b) { return a+b; }) / sleep_durations.length;

    // STEP TWO: add sleep durations, add sleep times where necessary, remove days with neither sleep nor wake time:
    var ret = [];
    for ( var n=0; n!=sleeps.length; ++n ) {
        var sleep = sleeps[n];
        if ( sleep.sleep_time ) {
            if ( sleep.wake_time ) {
                sleep.duration_class = 'has-both';
            } else {
                sleep.wake_time = sleep.sleep_time + average_sleep_duration;
                sleep.duration_class = 'missing-wake';
            }
        } else {
            if ( sleep.wake_time ) {
                sleep.sleep_time = sleep.wake_time - average_sleep_duration;
                sleep.duration_class = 'missing-sleep';
            } else {
                continue;
            }
        }
        sleep.sleep_duration = sleep.wake_time - sleep.sleep_time;
        sleep.sleep_title = new Date(sleep.sleep_time) + ' - ' + new Date(sleep.wake_time);
        ret.push(sleep);
    }

    return ret;
}

function diary_plot(sleeps) {

    var ret = '<div class="diary-plot"><div class="hours" title="hour">00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24</div>';

    sleeps = fix_sleep_data(sleeps);
    if ( !sleeps.length ) return '<div style="text-align:center">(not enough data)</div>';

    var start_day = Math.floor( ( sleeps[0].sleep_time || sleeps[0].wake_time ) / (1000*60*60*24) ) - 2 + new Date().getTimezoneOffset();

    for ( var n=0; n!=sleeps.length; ++n ) {
        var sleep = sleeps[n];

        var sleep_date = new Date(sleep.sleep_time),
            top  = Math.floor( sleep.sleep_time / (1000*60*60*24) ) - start_day,
            left = ( sleep_date.getHours()*3600 + sleep_date.getMinutes()*60 + sleep_date.getSeconds() ) / (6*6*24),
            width = sleep.sleep_duration / (1000*6*6*24);

	if ( left + width > 100 ) {
	    var width1 = 100 - left;
	    var width2 = width - width1;
	    var top2 = top + 1;
	    ret += '<div style="top:'+top +'em;left:'+left+'%;width:'+width1+'%" class="sleep continues-tomorrow '+sleep.duration_class+'" title="'+sleep.sleep_title+'"></div>';
	    ret += '<div style="top:'+top2+'em;left:'+0    +';width:'+width2+'%" class="sleep since-yesterday '   +sleep.duration_class+'" title="'+sleep.sleep_title+'"></div>\n';
        } else {
	    ret += '<div style="top:'+top +'em;left:'+left+'%;width:'+width +'%" class="sleep '                   +sleep.duration_class+'" title="'+sleep.sleep_title+'"></div>\n';
	}

    }

    return ret + '</div>';

}
