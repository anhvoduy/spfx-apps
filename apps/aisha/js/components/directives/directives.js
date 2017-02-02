// aisha directives
(function () {
    angular.module('aisha.directives', [])
    .directive('headerArea', function () {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'headerAreaController',
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
            controller: 'featureAreaController',
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
            controller: 'storyAreaController',
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
            controller: 'clientSayAreaController',
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
            controller: 'experienceAreaController',
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
            controller: 'blogAreaController',
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
            controller: 'actionAreaController',
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
            controller: 'footerAreaController',
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/views/footerArea.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    })
    .directive('skillPercent', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                skill: '='
            },
            templateUrl: function () {
                return "/Style%20Library/apps/aisha/js/components/views/skillPercent.tpl.html";
            },
            link: function (scope, element, attrs, ngCtrl) {
                wowInittialize();                
                scope.percent = '0%';
                if(scope.skill && scope.skill.progress){
                    scope.percent = scope.skill.progress + '%';
                }
            }
        };
    });
})();