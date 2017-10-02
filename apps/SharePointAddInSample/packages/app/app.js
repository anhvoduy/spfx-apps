(function(){
	'use strict';
	angular.module('appSample',[])
	.directive('sampleSearch', sampleSearch)
	.controller('sampleSearchController', sampleSearchController)
	.filter('searchFor', searchFor);
	
	// directives    
    sampleSearch.$inject = [];
    function sampleSearch(){
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            controller: 'sampleSearchController',			
			template: function () {
				var template = 
				'<div id="#instantSearch" class="instantSearch">											' +
				'	<div class="bar">        																' +
				'		<input type="text" ng-model="searchString" placeholder="Enter your search terms" /> ' +
				'	</div>																					' +
				'	<ul>        																			' +
				'		<li ng-repeat="i in items | searchFor:searchString">								' +
				'			<a href="{{i.url}}">															' +
				'				<img ng-src="{{i.image}}" />												' +
				'			</a>																			' +
				'			<p>{{i.title}}</p>																' +
				'		</li>																				' +
				'	</ul>            																		' +
				'</div>																						';
				return template;
            },
            link: function (scope, element, attrs, ngCtrl) {
                console.log('init directive sample-search.....');
            }
        };
    };

    // controllers
    sampleSearchController.$inject = ['$scope'];
    function sampleSearchController($scope){
		// models
		$scope.searchString = '';		
		$scope.items = [
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: '50 Must-have plugins for extending Twitter Bootstrap',				
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'Making a Super Simple Registration System With PHP and MySQL',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'Create a slide-out footer with this neat z-index trick',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'How to Make a Digital Clock with jQuery and CSS3',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'Smooth Diagonal Fade Gallery with CSS3 Transitions',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'Mini AJAX File Upload Form',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			},
			{
				url: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png',
				title: 'Your First Backbone.js App – Service Chooser',
				image: 'https://development365.sharepoint.com/Style%20Library/SharePointAddInSample/img/logo.png'
			}
		];
		
		// functions
        var activate = function(){
			console.log('--- activate: controller ---');			
		}		
		
		// start
        activate();
	}
	
	// instance search filter
	function searchFor(){		
		return function(arr, searchString){
			if(!searchString) return arr;

			var result = [];
			searchString = searchString.toLowerCase();
			// Using the forEach helper method to loop through the array
			angular.forEach(arr, function(item){
				if(item.title.toLowerCase().indexOf(searchString) !== -1){
					result.push(item);
				}
			});
			return result;
		}
	};
	
	
	// angular bootstrap
	angular.element(function() {
      angular.bootstrap(appSample, ['appSample']);
    });
})();