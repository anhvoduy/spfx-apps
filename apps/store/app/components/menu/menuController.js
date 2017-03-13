(function(){
    'use strict';
    angular.module('store.menu.controller', ['store.menu.service'])
	.controller('menuController', ['$scope', '$location', 'menuService', function ($scope, $location, menuService) {
        // declare models & methods
        var activate = function(){
            $scope.menuItems = menuService.getMenuItems();
            angular.forEach($scope.menuItems, function(item){
                if($location.$$absUrl.indexOf(item.link) > 0){
                    item.active = true;               
                } else {
                    item.active = false;
                }
            });
            if($location.$$absUrl === 'http://localhost:8080/'){
                $scope.menuItems[0].active = true;
            }
        };
		
        // activate
		activate();
	}]);
})();