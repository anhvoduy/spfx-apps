import { ISearchResults } from './ISearchResult';

export interface ISearchService {
    getSearchResults(webUrl: string, contentType:string): angular.IPromise<ISearchResults>;
}