(function () {
    'use strict';
    angular.module('aisha.services', ['aisha.common'])    
    .factory('aishaService', ['$http', '$q', 'appCommon', function ($http, $q, appCommon) {
        // constructor
        var aishaService = function () {
            this._siteUrl = '';
        };

        aishaService.prototype.getNavBars = function () {
            var q = $q.defer();
            var data = [
                { title: 'Home', link: '#'},
                { title: 'About', link: '#'},
                { title: 'Blogs', link: '#'},
                { title: 'Portfolio', link: '#'},
                { title: 'Contact', link: '#'}
            ];
            q.resolve(data.sort());
            return q.promise;
        };

        aishaService.prototype.getHeader = function () {
            var q = $q.defer();
            var data = {
                slogan: 'We are here to create @mazing things.',
                description: 
                    'It’s not only a Mission Impossible in the movies.' + 
                    '</br>' + 
                    'In real life, we always try to make a mission possible done.',
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
                description: 'It’s not only a Mission Impossible in the movies.',
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
                description: 'It’s not only a Mission Impossible in the movies.',
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
                description: 'It’s not only a Mission Impossible in the movies.',
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
                desc1: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                desc2: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                caseStudy: {
                    title: 'View case studies',
                    link: '#'                        
                },
                skills: [
                    {title: 'Knockout Js', progress: 60},
                    {title: 'React Js', progress: 55},
                    {title: 'Angular Js', progress: 92},
                    {title: 'Node Js', progress: 81},
                    {title: 'SharePoint Design Architecture', progress: 88},
                    {title: 'SharePoint App Development', progress: 85}
                ]
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getBlogs = function () {
            var q = $q.defer();
            var data = [
                { 
                    image: '/Style%20Library/apps/aisha/images/1.jpg',
                    title: 'IOS and Android comparison',
                    created: 'March 4, 2014',
                    commentsCount: 3,
                    summary: 
                    'Shortly thereafter, I was working with RetailMeNot, tasked with designing its IOS and Android tutorial.' + 
                    'The product team wanted to make sure hat users were clear about the value...',
                },
                { 
                    image: '/Style%20Library/apps/aisha/images/2.jpg',
                    title: 'Angular and React comparison',
                    created: 'May 25, 2015',
                    commentsCount: 3,
                    summary: 
                    'Shortly thereafter, I was working with RetailMeNot, tasked with designing its Angular and React tutorial.' + 
                    'The product team wanted to make sure hat users were clear about the value...',
                },
                { 
                    image: '/Style%20Library/apps/aisha/images/3.jpg',
                    title: 'Node Js and .Net Core comparison',
                    created: 'Jun 26, 2016',
                    commentsCount: 3,
                    summary: 
                    'Shortly thereafter, I was working with RetailMeNot, tasked with designing its Node Js and .Net Core tutorial.' + 
                    'The product team wanted to make sure hat users were clear about the value...',
                },
                { 
                    image: '/Style%20Library/apps/aisha/images/4.jpg',
                    title: 'Grunt and Gulp comparison',
                    created: 'Sep 9, 2016',
                    commentsCount: 3,
                    summary: 
                    'Shortly thereafter, I was working with RetailMeNot, tasked with designing its Grunt and Gulp tutorial.' + 
                    'The product team wanted to make sure hat users were clear about the value...',
                }
            ];
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getAction = function () {
            var q = $q.defer();
            var data = {
                title: 'Are you ready to start?',
                desc: 'Contact us to submit your questions about SharePoint/JavaScript or discuss your ideas',
                contact: {
                    title: 'Contact Us',
                    link: '#'
                }
            };
            q.resolve(data);
            return q.promise;
        };

        aishaService.prototype.getFooter = function () {
            var q = $q.defer();
            var data = {
                location: 'Ho Chi Minh city',
                desc: '',
                email: 'duyanh2005@gmail.com'
            };
            q.resolve(data);
            return q.promise;
        };

        return new aishaService();
    }]);
})();
