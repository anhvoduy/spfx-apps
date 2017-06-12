import { ISearchService } from './../models/ISearchService';

export default class SearchController {
    public static $inject: string[] = ['SearchService', '$window', '$rootScope'];    

    constructor(
        private searchService: ISearchService,
        private $window: angular.IWindowService, 
        private $rootScope: angular.IRootScopeService
    ) {
        
        const vm: SearchController = this;
        this.init();
    }

    private init(): void {
        
    }    
}