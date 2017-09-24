(function () {
    'use strict';
    angular.module('aisha.controllers', ['aisha.common', 'aisha.services'])
	.controller('headerAreaController', ['$scope', '$q', '$sce', 'appCommon', 'aishaService',
		function ($scope, $q, $sce, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getHeader().then(function(result){
					$scope.header = result;
					$scope.header.description = $sce.trustAsHtml(result.description);
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();
		}])
	.controller('featureAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getFeature().then(function(result){
					$scope.feature = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();			
		}])
	.controller('storyAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getStory().then(function(result){
					$scope.story = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();			
		}])	
	.controller('clientSayAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getClientSay().then(function(result){
					$scope.clientSay = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();
		}])
	.controller('experienceAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getExperience().then(function(result){
					$scope.experience = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();			
		}])
	.controller('blogAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getBlogs().then(function(result){
					$scope.blogs = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();			
		}])
	.controller('actionAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getAction().then(function(result){
					$scope.action = result;					
				}, function(err){
					console.log(err);
				});

				aishaService.getNavBars().then(function(result){
					$scope.navBars = result;					
				}, function(err){
					console.log(err);
				})
			}

			// activate
			activate();				
		}])	
	.controller('footerAreaController', ['$scope', '$q', 'appCommon', 'aishaService',
		function ($scope, $q, appCommon, aishaService) {
			// declare models & methods
			var activate = function(){
				aishaService.getFooter().then(function(result){
					$scope.footer = result;					
				}, function(err){
					console.log(err);
				})
			}
			
			// activate
			activate();			
		}]);
})();
