(function(){
    'use strict';
    angular.module('store.menu.service', [])
    .factory('menuService', ['$http', '$q', function ($http, $q) {
        // constructor
        var menuService = function () {
            
        };

        menuService.prototype.getData = function () {
            var q = $q.defer();
            var data = [
                { title: 'Home', link: '#'},
                { title: 'About', link: '#'},
                { title: 'Blogs', link: '#'},
                { title: 'Portfolio', link: '#'},
                { title: 'Contact', link: '#'}
            ];            
            q.resolve(data);
            return q.promise;
        };

        return new menuService();
	}]);    
})();