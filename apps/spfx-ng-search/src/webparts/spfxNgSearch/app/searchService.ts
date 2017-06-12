import * as angular from 'angular';
import { ISearchResults, IPrimaryQueryResult } from './../models/ISearchResult';
import { ISearchService } from './../models/ISearchService';

export default class SearchService implements ISearchService {
    public static $inject: string[] = ['$q', '$http'];
    
    constructor(
        private $q: angular.IQService, 
        private $http: angular.IHttpService
    ){

    };

    public getSearchResults(webUrl: string, contentType: string): angular.IPromise<ISearchResults>{
        const deferred: angular.IDeferred<ISearchResults> = this.$q.defer();
        this.$http({
            url: `
                ${webUrl}/_api/search/query?queryText='ContentType:"${contentType}"
                Path:${webUrl}'&selectproperties='Title,Author,HitHighlightedSummary,PublishingImage,Url'`,
            method: 'GET',
            headers: {
                'Accept': 'application/json;odata=verbose'
            }
        }).then((response: angular.IHttpPromiseCallbackArg<any>): void => {
            if(response != null && response.data != null){
                const result: ISearchResults = response.data.d.query;
                if(typeof result.PrimaryQueryResult !== undefined && 
                   typeof result.PrimaryQueryResult.RelevantResults !== undefined &&
                   typeof result.PrimaryQueryResult.RelevantResults.Table !== undefined && 
                   typeof result.PrimaryQueryResult.RelevantResults.Table.Rows !== undefined){
                       deferred.resolve(result);
                   }else{
                       deferred.reject('Problem getting search results');
                   }                
            }else{
                deferred.reject('Problem getting search results');
            }            
        }, (error: any): void => {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    
}
