import * as angular from 'angular';
import SearchController from './searchController';
import SearchService from './searchService';

angular
.module('angularsearchapp', [
    'officeuifabric.core',
    'officeuifabric.components'
])
.component('angularsearch', {
    controller: (SearchController),
    controllerAs: 'vm',
    bindings: {
        web: '@',
        style: '<',
        contentType: '@'
    },
    template: require(`search-template.html`).toString()
})
.service('SearchService', SearchService);
