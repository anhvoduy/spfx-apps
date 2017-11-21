(function () {
    'use strict';
    angular.module('calendar.services', []).factory('calendarService', calendarService);
    
    // services
    calendarService.$inject = ['$http', '$q'];
    function calendarService($http, $q) {
        // constructor
        var calendarService = function () {
        }
        return new calendarService;
    }
})();