(function () {
    'use strict';
    angular.module('aisha.services.baseService', ['aisha.common'])
    .factory('baseService', ['$http', '$q', function ($http, $q) {
		// constructor
        var baseService = function () {
			//TO DO: review code BaseService & merge code inheritance
        }

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
        }

        baseService.prototype.getItemById = function (siteUrl, listTitle, itemId) {
            var url = String.format("{0}/_api/web/lists/getbytitle('{1}')/items?$filter=Id eq {2}", siteUrl, listTitle, itemId);

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
        }

        baseService.prototype.createItem = function (siteUrl, listTitle, item) {
            var url = String.format("{0}/_api/web/lists/getbytitle('{1}')/items", siteUrl, listTitle);

            var q = $q.defer();
            $http({
                url: url,
                method: 'POST',
                data: JSON.stringify(item),
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            }).success(function (result) {
                q.resolve(result);
            }).error(function (error, status) {
                q.reject(error);
            });
            return q.promise;
        }

        baseService.prototype.editItem = function (siteUrl, listTitle, item) {
            var q = $q.defer();
            var self = this;
            // update list item by id
            self.getItemById(siteUrl, listTitle, item.Id).then(function (data) {
                // update list item
                $http({
                    url: data.__metadata.uri,
                    method: 'POST',
                    data: JSON.stringify(item),
                    headers: {
                        "Content-Type": "application/json;odata=verbose",
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "X-HTTP-Method": "MERGE",
                        "If-Match": data.__metadata.etag
                    }
                }).success(function (result) {
                    q.resolve(true);
                }).error(function (error, status) {
                    q.reject(error);
                });
            }, function (error, status) {
                q.reject(status);
            });
            return q.promise;
        }

        baseService.prototype.deleteItem = function (siteUrl, listTitle, itemId) {
            var url = String.format("{0}/_api/web/lists/getbytitle('{1}')/items({2})", siteUrl, listTitle, itemId);

            var q = $q.defer();
            $http({
                url: url,
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "If-Match": "*"
                }
            }).success(function (result) {
                q.resolve(result);
            }).error(function (error, status) {
                q.reject(error);
            });
            return q.promise;
        };

        baseService.prototype.uploadFiles = function (uri, files) {
            // You can upload files up to 2 GB with the REST API.
            var length = files.length,
                i = 0,
                self = this,
                deferred = $q.defer();

            function next(i) {
                self.attachFileToList(uri, files[i].name, files[i].binaryData).then(function () {
                    i = i + 1;
                    var file = files[i];
                    if (file) {
                        next(i);
                    } else {
                        deferred.resolve('done');
                    }
                });
            }
            next(i);
            return deferred.promise;
        };

        baseService.prototype.attachFileToList = function (uri, fileName, data) {
            var url = String.format("{0}/AttachmentFiles/add(FileName='{1}')", uri, fileName);
            var deferred = $q.defer();
            $http({
                url: url,
                method: 'POST',
                async: false,
                processData: false,
                binaryStringRequestBody: true,
                transformRequest: [],
                data: data,
                headers: {
                    'accept': 'application/json;odata=verbose',
                    'X-RequestDigest': $("#__REQUESTDIGEST").val(),
                    'content-Type': 'application/json;odata=verbose'
                }
            }).success(function (result) {
                deferred.resolve(result);
            }).error(function (result, status) {
                deferred.reject(status);
            });
            return deferred.promise;
        };

        return new baseService;
    }])
})();
