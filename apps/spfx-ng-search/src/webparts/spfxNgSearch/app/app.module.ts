import * as angular from 'angular';
import SearchController from './searchController';
import DataService from './dataService';

const todoapp: angular.IModule = angular.module('todoapp', []);

todoapp
    .controller('SearchController', SearchController)
    .service('DataService', DataService);
