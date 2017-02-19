/* store app */
(function ($) {
	"use strict";
    // load modules
    angular.module('store', ['store.common']);
    
    // boostrap
    angular.element(function() {
        angular.bootstrap(document, ['store']);
    });
}());
