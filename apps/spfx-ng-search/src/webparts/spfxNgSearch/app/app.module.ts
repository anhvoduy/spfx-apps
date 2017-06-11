import * as angular from 'angular';
import SearchController from './searchController';
import SearchService from './searchService';

const todoapp: angular.IModule = angular.module('todoapp', []);

todoapp    
    .controller('SearchController', SearchController)
    .service('SearchService', SearchService);
