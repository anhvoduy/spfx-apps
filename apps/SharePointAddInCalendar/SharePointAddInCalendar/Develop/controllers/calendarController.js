(function () {
    'use strict';
    angular.module('calendar.controllers', []).controller('calendarController', calendarController);

    // controllers
    calendarController.$inject = ['$scope', '$q', 'calendarService'];
    function calendarController($scope, $q, calendarService) {

        function activate() {
        }

        // start
        activate();
    }
})();