// aisha directives
(function () {
    angular.module('aisha.directives', ['aisha.common'])
    .directive('headerArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'headerAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/headerArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {				
                wowInittialize();
            }
        };
    }])
    .directive('featureArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'featureAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/featureArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('storyArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'storyAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/storyArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('clientSayArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'clientSayAreaController',
            templateUrl: function () {                
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/clientSayArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('experienceArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'experienceAreaController',
            templateUrl: function () {                
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/experienceArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('blogArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'blogAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/blogArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('actionArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'actionAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/actionArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('footerArea',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            controller: 'footerAreaController',
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/footerArea.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
				wowInittialize();
            }
        };
    }])
    .directive('skillPercent',['appCommon', function (appCommon) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                skill: '='
            },
            templateUrl: function () {
                return String.format('{0}{1}',appCommon.baseUrl, "js/components/views/skillPercent.tpl.html");
            },
            link: function (scope, element, attrs, ngCtrl) {
                wowInittialize();                
                scope.percent = '0%';
                if(scope.skill && scope.skill.progress){
                    scope.percent = scope.skill.progress + '%';
                }
            }
        };
    }]);
})();