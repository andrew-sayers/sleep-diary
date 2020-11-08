# Non-24 sleep diary

A web-based sleep diary, with some extra features to help manage [non-24 sleep-wake disorder](https://en.wikipedia.org/wiki/Non-24-hour_sleep%E2%80%93wake_disorder).

# Quick start

[Click here to go to the diary](diary.html)

Press the _sun_ icon when you wake up in the morning

Press the _moon_ icon when you go to sleep at night

Click on _Tools_ at the bottom for more options

By default, your data is only stored in your browser.  Your data will be not be available in other browsers, and will be deleted if you clear this site's data.

Most browsers require you to allow cookies in order for this site to work.  This site actually uses [web storage](https://en.wikipedia.org/wiki/Web_storage), which is a more private alternative to cookies.  We also use third-party code that may set cookies, but these third-party cookies can be safely blocked.

# Information for developers

This site is designed to manage common use cases, but you may need to adapt it for your personal use case.  You can download the repository and run it on any web server, or fork it on GitHub and run it there.

## Alternative usernames

It can be useful to develop features as a test user, in case you accidentally break your actual sleep diary data.  To use a different username, just add <tt>?username=...</tt> to URLs.  For example, [click here to go to the diary as user <tt>test</tt>](diary.html?username=test).

## Logging data to a server

If you want to send data a web server you control, click on <tt>Tools</tt> at the bottom of the diary page, then select <tt>Configure</tt>, <tt>Save events to a server</tt> and enter a URL.  Requests will regularly be sent to <tt>&lt;your-url&gt;?username=&lt;username&gt;&log=&lt;events&gt;</tt>.  Requests will usually be sent as soon as the button is pressed, but might be delayed if the device is having connectivity issues.  The server can send any response (even <tt>404 not found</tt>).

Log messages are sent in a compact text format.  See [cook-data.js](cook-data.js) for information about how to parse this data.  In fact, it's recommended to convert log files to JSON by calling <tt>cook-data.js</tt> from a [NodeJS](https://nodejs.org/) script.  You can then process the data in your preferred language.

If you don't want to write a server-side script to handle messages, you can just enter a non-existent URL and read requests from the server's access log.

See [example-log-reader.js](example-log-reader.js) for an example script that reads from an access log and parses data using <tt>cook-data.js</tt>.

# Legal information

See [LICENSE.txt](LICENSE.txt) for license information.  The _sun_ and _moon_ icons are taken from [Breathe-weather-clear.svg](https://commons.wikimedia.org/wiki/File:Breathe-weather-clear.svg) and [Breathe-weather-clear-night.svg](https://commons.wikimedia.org/wiki/File:Breathe-weather-clear-night.svg) on Wikimedia Commons.
