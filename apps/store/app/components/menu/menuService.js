(function(){
    'use strict';
    angular.module('store.menu.service', [])
    .factory('menuService', ['$http', '$q', function ($http, $q) {
        // constructor
        var menuService = function () {
            
        };

        menuService.prototype.getMenuItems = function () {            
            var data = [
                { title: 'Home', link: 'index.html'},
                { title: 'Shop page', link: 'shop.html'},
                { title: 'Single product', link: 'single-product.html'},
                { title: 'Cart', link: 'cart.html'},
                { title: 'Checkout', link: 'checkout.html'},
                { title: 'Category', link: '#'},
                { title: 'Others', link: '#'},
                { title: 'Contact', link: '#'},
                { title: 'About Us', link: '#'}
            ];            
            return data;
        };
        return new menuService();
	}]);    
})();