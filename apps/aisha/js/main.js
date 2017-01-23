(function ($) {
	"use strict";
    jQuery(window).load(function(){
        // Preloader
        $("#preloader").fadeOut(500);
    });	
}(jQuery));

// init wow
// new WOW().init();
var wowInittialize = function(){
    return new WOW().init();
};

// aisha app
(function ($) {
	"use strict";
    // load modules
    angular.module('aisha', ['aisha.common', 'aisha.controllers', 'aisha.directives', 'aisha.services']);
    
    // boostrap
    angular.element(function() {
        angular.bootstrap(document, ['aisha']);
    });
}());
