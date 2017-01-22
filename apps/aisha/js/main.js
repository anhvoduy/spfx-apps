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
    // load module
    angular.module('aisha', ['aisha.components'])
    .config(function() {
        new WOW().init();
    });
    
    // boostrap
    angular.element(function() {
        angular.bootstrap(document, ['aisha']);
    });
}());

// aisha directives
(function () {
    angular.module('aisha.components', [])
    .directive('headerArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/headerArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {				
                wowInittialize();
            }
        };
    })
    .directive('featureArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/featureArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('storyArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/storyArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('clientSayArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/clientSayArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('experienceArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/experienceArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('blogArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/blogArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('actionArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/actionArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('footerArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/footerArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    });
})();