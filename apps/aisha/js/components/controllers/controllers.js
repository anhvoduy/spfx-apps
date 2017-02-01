(function () {
    'use strict';
    angular.module('aisha.controllers', ['aisha.common', 'aisha.services'])
	.controller('headerAreaController', ['$scope', '$q', '$timeout', 'appCommon', 'aishaService',
		function ($scope, $q, $timeout, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';			
		}])
	.controller('featureAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])
	.controller('storyAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])	
	.controller('clientSayAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])
	.controller('experienceAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])		
	.controller('blogAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])			
	.controller('actionAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}])	
	.controller('footerAreaController', ['$scope', '$q', '$interval', 'appCommon', 'aishaService',
		function ($scope, $q, $interval, appCommon, aishaService) {
			// declare models
			$scope.model = 'init';
			
		}]);
})();


