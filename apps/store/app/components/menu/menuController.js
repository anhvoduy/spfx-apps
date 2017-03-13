(function(){
    'use strict';
    angular.module('store.menu.controller', [])
	.controller('menuController', ['$scope', '$q', function ($scope, $q) {
        // declare models & methods
        var activate = function(){
            console.log('initialize menu...');
        }
		
        // activate
		activate();
	}]);
})();