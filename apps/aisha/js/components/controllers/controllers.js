(function () {
    'use strict';
    angular.module('aisha.controllers', ['aisha.common', 'aisha.services'])
	.controller('baseController', ['$scope', '$q', '$timeout', 'appCommon', 'feedbackService',
		function ($scope, $q, $timeout, appCommon, feedbackService) {
			// declare models
			$scope.model = 'init';
			
		}])
	.controller('aishaController', ['$scope', '$q', '$interval', 'appCommon', 'feedbackService',
		function ($scope, $q, $interval, appCommon, feedbackService) {
			// declare models
			$scope.model = 'init';
			
		}])
})();

