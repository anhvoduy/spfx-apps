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
            template: '<div> sample search template </div>',
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
		$scope.items = [];
		
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
				if(item.DisplayName.toLowerCase().indexOf(searchString) !== -1){
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