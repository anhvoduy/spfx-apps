'use strict';

// init client context
(function () {
    ExecuteOrDelayUntilScriptLoaded(initializePage, "sp.js");

    function initializePage() {
        var context = SP.ClientContext.get_current();
        var user = context.get_web().get_currentUser();

        // This code runs when the DOM is ready and creates a context object which is needed to use the SharePoint object model
        $(document).ready(function () {
            getUserName();
        });

        // This function prepares, loads, and then executes a SharePoint query to get the current users information
        function getUserName() {
            context.load(user);
            context.executeQueryAsync(onGetUserNameSuccess, onGetUserNameFail);
        }

        // This function is executed if the above call is successful
        // It replaces the contents of the 'message' element with the user name
        function onGetUserNameSuccess() {
            $('#message').text('Hello ' + user.get_title());
        }

        // This function is executed if the above call fails
        function onGetUserNameFail(sender, args) {
            alert('Failed to get user name. Error:' + args.get_message());
        }
    }
})();


// prevent default form submit
(function () {
    $(document).ready(function () {
        $("#aspnetForm").submit(function (e) {
            e.preventDefault();
            return false;
        });
    });
})();


// function generate calendar
(function () {
    $(document).ready(function () {
        var calendar = {
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay'
            },
            defaultDate: '2017-10-12',
            navLinks: true, // can click day/week names to navigate views
            selectable: true,
            selectHelper: true,
            select: function (start, end) {
                var title = prompt('Event Title:');
                var eventData;
                if (title) {
                    eventData = {
                        title: title,
                        start: start,
                        end: end
                    };
                    $('#calendar').fullCalendar('renderEvent', eventData, true); // stick? = true
                }
                $('#calendar').fullCalendar('unselect');
            },
            editable: true,
            eventLimit: true, // allow "more" link when too many events
            events: [
                {
                    title: 'All Day Event',
                    start: '2017-10-01'
                },
                {
                    title: 'Long Event',
                    start: '2017-10-07',
                    end: '2017-10-10'
                },
                {
                    id: 999,
                    title: 'Repeating Event',
                    start: '2017-10-09T16:00:00'
                },
                {
                    id: 999,
                    title: 'Repeating Event',
                    start: '2017-10-16T16:00:00'
                },
                {
                    title: 'Conference',
                    start: '2017-10-11',
                    end: '2017-10-13'
                },
                {
                    title: 'Meeting',
                    start: '2017-10-12T10:30:00',
                    end: '2017-10-12T12:30:00'
                },
                {
                    title: 'Lunch',
                    start: '2017-10-12T12:00:00'
                },
                {
                    title: 'Meeting',
                    start: '2017-10-12T14:30:00'
                },
                {
                    title: 'Happy Hour',
                    start: '2017-10-12T17:30:00'
                },
                {
                    title: 'Dinner',
                    start: '2017-10-12T20:00:00'
                },
                {
                    title: 'Birthday Party',
                    start: '2017-10-13T07:00:00'
                },
                {
                    title: 'Click for Google',
                    url: 'http://google.com/',
                    start: '2017-10-28'
                }
            ]
        }

        // init calendar
        $('#calendar').fullCalendar(calendar);
    });
})();