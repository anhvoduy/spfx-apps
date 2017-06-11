import * as angular from 'angular';
import HomeController from './homeController';
import DataService from './dataService';

const todoapp: angular.IModule = angular.module('todoapp', []);

todoapp
    .controller('HomeController', HomeController)    
    .service('DataService', DataService);
