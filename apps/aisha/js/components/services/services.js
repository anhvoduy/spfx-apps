(function () {
    'use strict';
    angular.module('aisha.services', ['aisha.common'])    
    .factory('aishaService', ['$http', '$q', 'appCommon', function ($http, $q, appCommon) {
        // constructor
        var aishaService = function () {
            this._siteUrl = '';
        };

        aishaService.prototype.getHeader = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getFeature = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getStory = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getClientSay = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getExperience = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getBlogs = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getActions = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getFooter = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 'It’s not only a Mission Impossible in the movies. </br> In real life, we always try make a mission possible done.',
                submit: {
                    title: 'START  TODAY  with  us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        return new aishaService();
    }]);
})();
