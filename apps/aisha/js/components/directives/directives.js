// aisha directives
(function () {
    angular.module('aisha.directives', [])
    .directive('headerArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/views/headerArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/featureArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/storyArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/clientSayArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/experienceArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/blogArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/actionArea.tpl.html";
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
                return "/Style%20Library/apps/aisha/js/components/views/footerArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    });
})();