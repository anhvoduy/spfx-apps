(function () {
    'use strict';
    angular.module('aisha.services', ['aisha.common'])
    .factory('baseService', ['$http', '$q', function ($http, $q) {
		// constructor
        var baseService = function () {
			//TO DO: review code BaseService & merge code inheritance
        };

        // methods
        baseService.prototype.getData = function (siteUrl, listTitle) {
            var url = String.format("{0}/_api/web/lists/getbytitle('{1}')/items", siteUrl, listTitle);

            var q = $q.defer();
            $http({
                url: url,
                method: 'GET',
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose"
                }
            }).success(function (result) {
                q.resolve(result);
            }).error(function (error, status) {
                q.reject(error);
            });
            return q.promise;
        };

        return new baseService();
    }])
    .factory('aishaService', ['$http', '$q', 'appCommon', function ($http, $q, appCommon) {
        // constructor
        var aishaService = function () {
            //this._siteUrl = _spPageContextInfo.webAbsoluteUrl;
            this._siteUrl = '';
            this._digest = $("#__REQUESTDIGEST").val();
        };                                

        aishaService.prototype.getItemById = function (siteUrl, listTitle, itemId) {                
            var listGuid = appCommon.getListIdByListTitle(listTitle);
            var url = String.format("{0}/_api/web/lists(guid'{1}')/items?$filter=Id eq {2}", siteUrl, listGuid, itemId);

            var q = $q.defer();
            $http({
                url: url,
                method: 'GET',
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose"
                }
            }).success(function (result) {
                q.resolve(result.d.results[0]);
            }).error(function (error, status) {
                q.reject(error);
            });
            return q.promise;
        };

        return new aishaService();
    }]);
})();
