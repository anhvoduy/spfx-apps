import * as angular from 'angular';
import { ISearchResults, IPrimaryQueryResult } from './../models/ISearchResult';
import { ISearchService } from './../models/ISearchService';

export default class SearchService implements ISearchService {
    public static $inject: string[] = ['$q'];    
    
    constructor(private $q: angular.IQService){

    }
    
}
