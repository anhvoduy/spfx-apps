'use strict';

// calendar app
(function () {
    angular.module('calendar', [
        'calendar.controllers',
        'calendar.directives',
        'calendar.services'
    ]);


    // angular bootstrap
    angular.element(function () {
        angular.bootstrap(calendar, ['calendar']);
    });
})();


// init client context
(function () {
    ExecuteOrDelayUntilScriptLoaded(initializePage, "sp.js");
    function initializePage() {
        var context = SP.ClientContext.get_current();
        var user = context.get_web().get_currentUser();
        
        $(document).ready(function () {
            getUserName();
        });
        
        function getUserName() {
            context.load(user);
            context.executeQueryAsync(onGetUserNameSuccess, onGetUserNameFail);
        }
        
        function onGetUserNameSuccess() {
            $('#message').text('Hello ' + user.get_title());
        }
        
        function onGetUserNameFail(sender, args) {
            alert('Failed to get user name. Error:' + args.get_message());
        }
    }
})();
