(function () {
    'use strict';
    angular.module('calendar.directives', []).directive('ngCalendar', ngCalendar);

    // directives
    ngCalendar.$inject = [];
    function ngCalendar() {
        var calendar = {
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay'
            },
            defaultDate: moment(Date.now()).format('YYYY-MM-DD'),
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
                    start: moment(new Date(2017, 10, 1)).format('YYYY-MM-DD')
                },
                {
                    title: 'Long Event',
                    start: '2017-11-07',
                    end: '2017-11-10'
                },
                {
                    id: 999,
                    title: 'Develop SharePoint 365',
                    start: '2017-11-21T16:00:00'
                },
                {
                    id: 999,
                    title: 'Repeating Event',
                    start: '2017-11-16T16:00:00'
                },
                {
                    title: 'Conference',
                    start: '2017-11-11',
                    end: '2017-11-13'
                },
                {
                    title: 'Meeting',
                    start: '2017-11-12T10:30:00',
                    end: '2017-11-12T12:30:00'
                },
                {
                    title: 'Lunch',
                    start: '2017-11-12T12:00:00'
                },
                {
                    title: 'Meeting',
                    start: '2017-11-12T14:30:00'
                },
                {
                    title: 'Happy Hour',
                    start: '2017-11-12T17:30:00'
                },
                {
                    title: 'Dinner',
                    start: '2017-11-12T20:00:00'
                },
                {
                    title: 'Birthday Party',
                    start: '2017-11-13T07:00:00'
                },
                {
                    title: 'Click for Google',
                    url: 'http://google.com/',
                    start: '2017-11-28'
                }
            ]
        }

        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {                
                events: "="
            },
            controller: 'calendarController',
            link: function (scope, element, attrs, ngCtrl) {
                console.log(scope.events);
                // render calendar
                $('#calendar').fullCalendar(calendar);
            }
        }
    }    
})();