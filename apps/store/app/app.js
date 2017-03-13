/* store app */
(function ($) {
	"use strict";
    // load modules
    angular.module('store', [
        'store.common',
        'store.menu.controller', 'store.menu.service', 'store.menu.directive'
    ]);
    
    // boostrap
    angular.element(function() {
        angular.bootstrap(document, ['store']);
    });
}());
