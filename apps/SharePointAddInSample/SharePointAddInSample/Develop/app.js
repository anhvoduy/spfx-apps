(function(){
	'use strict';
	angular.module('appSample',[])
	.directive('sampleSearch', sampleSearch)
	.controller('sampleSearchController', sampleSearchController)
	.factory('searchService', searchService)
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
				'	<div id="#instantSearch" class="instantSearch">																				 	       '+
				'		<div class="bar">        																									 	   '+				
				'			<input type="text" ng-model="searchString" ng-change="changeSearch(searchString)"                                              '+
				'                  placeholder="Enter your search terms" ng-keyup="$event.keyCode == 13 && submitSearch(searchString)"/>                   '+
				'		</div>																														 	   '+
				'		<ul>        																												 	   '+
				'			<li ng-repeat="i in items | searchFor:searchString">																	 	   '+
				'				<a href="{{i.url}}">																								 	   '+
				'					<img ng-src="{{i.image}}" />																					 	   '+
				'				</a>																												 	   '+
				'				<p>{{i.title}}</p>																									 	   '+
				'			</li>																													 	   '+
				'		</ul>            																											 	   '+
				'	</div>																															 	   ';				
				return template;
            },
            link: function (scope, element, attrs, ngCtrl) {
                console.log('init directive sample-search.....');
            }
        };
    };


    // controllers
    sampleSearchController.$inject = ['$scope', '$q', 'searchService'];
    function sampleSearchController($scope, $q, searchService){
		// models
		var siteUrl = _spPageContextInfo.siteAbsoluteUrl;		
		$scope.searchString = '';
		$scope.items = [
            {
				url: '../Images/logo.png',
				title: '50 Must-have plugins for extending Twitter Bootstrap',				
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'Making a Super Simple Registration System With PHP and MySQL',
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'Create a slide-out footer with this neat z-index trick',
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'How to Make a Digital Clock with jQuery and CSS3',
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'Smooth Diagonal Fade Gallery with CSS3 Transitions',
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'Mini AJAX File Upload Form',
				image: '../Images/logo.png'
			},
			{
				url: '../Images/logo.png',
				title: 'Your First Backbone.js App – Service Chooser',
				image: '../Images/logo.png'
			}
		];
		
		// functions
        var activate = function(){
			console.log('- activate():');
		}
		
		$scope.changeSearch = function(keyword){
			//console.log('- changeSearch():', keyword);
		}

		$scope.submitSearch = function(keyword){
			console.log('- submitSearch():', keyword);
						
			searchService.getData(siteUrl, keyword).then(function(result){
				if(result)
					console.log(result.d.query.PrimaryQueryResult);
			}, function(error){
				console.log(error);
			})
		};
		
		// start
        activate();
	};


	// services
	searchService.$inject = ['$http', '$q'];
	function searchService($http, $q){
		// constructor
		var searchService = function () {
		}
		
		// methods
        searchService.prototype.getData = function (siteUrl, keyword) {
            var url = String.format("{0}/_api/search/query?querytext='{1}'", siteUrl, keyword);

            var q = $q.defer();
            $http({
                url: url,
                method: 'GET',
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose"
                }
            }).success(function (result) {
                q.resolve(result);
            }).error(function (error, status) {
                q.reject(error);
            });
            return q.promise;
        }
		
		return new searchService;
	};
	

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


// prevent default form submit
(function(){
	//$(document).ready(function() {
	//	$("#aspnetForm").submit(function(e){
	//		e.preventDefault();
	//		return false;
	//	});
	//});

    angular.element('#aspnetForm').submit(function (e) {
        e.preventDefault();
        return false;
    });    
})();


