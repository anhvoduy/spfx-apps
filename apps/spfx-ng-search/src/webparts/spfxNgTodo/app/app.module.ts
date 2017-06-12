import * as angular from 'angular';
import HomeController from './homeController';
import DataService from './dataService';

const spfxNgTodo: angular.IModule = angular.module('spfxNgTodo', []);

spfxNgTodo
    .controller('HomeController', HomeController)    
    .service('DataService', DataService);
