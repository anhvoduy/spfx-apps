(function () {
    'use strict';
    angular.module('aisha.services', ['aisha.common'])
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
    .factory('aishaService', ['$http', '$q', 'appCommon', function ($http, $q, appCommon) {
        /* ---------------------------- constructor -------------------------------- */
        var aishaService = function () {
            this._siteUrl = _spPageContextInfo.webAbsoluteUrl;
            this._digest = $("#__REQUESTDIGEST").val();
        }
        
        /* ---------------------------- global properties & functions -------------- */
        var siteUrl = _spPageContextInfo.webAbsoluteUrl;

        var extendProperties = function (item) {
            var model = new Object();
            if (item.length != null) {
                model.length = item.length;
            }
            for (var key in item) {
                if (item.hasOwnProperty(key)) {
                    var property = key.charAt(0).toLowerCase() + key.slice(1);
                    model[property] = item[key];

                    if (angular.isObject(item[key])) {
                        var oldItem = item[key];
                        var newItem = extendProperties(oldItem);
                        model[property] = newItem;
                    }
                }
            }
            return model;
        };
                   
        var getItemTypeForListTitle = function (name) {
            return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
        }
        
        /* ---------------------------- User & Permission -------------------------- */
        aishaService.prototype.getCurrentUserWithDetails = function () {
            var url = String.format("{0}/_api/web/currentuser/?$expand=groups", siteUrl);

            var q = $q.defer();
            $http({
                url: url,
                method: 'GET',
                headers: {
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            }).success(function (result) {
                if (result.d.Groups.results.length == 0) {
                    var group = { Title: 'CEP General' };
                    result.d.Groups.results.push(group);
                };
                q.resolve(result.d.Groups.results);
            }).error(function (result, status) {
                q.reject(status);
            });
            return q.promise;
        };
        
        /* ---------------------------- Feedback Template -------------------------- */
        aishaService.prototype.createFeedbackTemplate = function (listTitle, feedbackTemplate) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Title": feedbackTemplate.title,
                "FeedbackTemplateTitle": feedbackTemplate.title,
                "FeedbackTemplateName": feedbackTemplate.name,
                "Section01": feedbackTemplate.section01,
                "Section02": feedbackTemplate.section02,
                "Section03": feedbackTemplate.section03,
                "Section04": feedbackTemplate.section04,
                "Section05": feedbackTemplate.section05
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.createItem(siteUrl, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.editFeedbackTemplate = function (listTitle, feedbackTemplate) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Id": feedbackTemplate.id,
                "Title": feedbackTemplate.title,
                "FeedbackTemplateTitle": feedbackTemplate.title,
                "FeedbackTemplateName": feedbackTemplate.name,
                "Section01": feedbackTemplate.section01,
                "Section02": feedbackTemplate.section02,
                "Section03": feedbackTemplate.section03,
                "Section04": feedbackTemplate.section04,
                "Section05": feedbackTemplate.section05
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.editItem(siteUrl, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.deleteFeedbackTemplate = function (listTitle, itemId) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.deleteItem(siteUrl, listTitle, itemId).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.getFeedbackTemplateById = function (listTitle, itemId) {
            if (itemId == undefined) {
                itemId = 1
            }
            // call REST API
            var q = $q.defer();
            var self = this;
            self.getData(siteUrl, listTitle, itemId).then(function (result) {
                var template = {};
                if (result.d.results.length > 0) {
                    template = extendProperties(result.d.results[0]);
                    template.name = template.feedbackTemplateName;
                    template.title = template.feedbackTemplateTitle;
                }
                q.resolve(template);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }
        
        /* ---------------------------- Feedback Options --------------------------- */
        aishaService.prototype.createFeedbackOption = function (listTitle, feedbackOption) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Title": feedbackOption.title,
                "FeedbackDescription": feedbackOption.description
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.createItem(siteUrl, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.editFeedbackOption = function (listTitle, feedbackOption) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Id": feedbackOption.id,
                "Title": feedbackOption.title,
                "FeedbackDescription": feedbackOption.description
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.editItem(siteUrl, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.deleteFeedbackOption = function (listTitle, itemId) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.deleteItem(siteUrl, listTitle, itemId).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.getFeedbackOption = function (listTitle) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.getData(siteUrl, listTitle).then(function (result) {
                var data = [];
                if (result.d.results.length > 0) {
                    angular.forEach(result.d.results, function (item) {
                        var model = extendProperties(item);
                        model.description = model.feedbackDescription;
                        model.deleted = false;
                        model.checked = false;
                        data.push(model);
                    });
                }
                q.resolve(data);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }
        
        /* ---------------------------- Feedback Questions ------------------------- */
        aishaService.prototype.createFeedbackQuestion = function (listTitle, feedbackQuestion) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Title": feedbackQuestion.title,
                "FeedbackDescription": feedbackQuestion.description
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.createItem(siteUrl, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.editFeedbackQuestion = function (listTitle, feedbackQuestion) {
            var url = _spPageContextInfo.webAbsoluteUrl;
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Id": feedbackQuestion.id,
                "Title": feedbackQuestion.title,
                "FeedbackDescription": feedbackQuestion.description
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.editItem(url, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.deleteFeedbackQuestion = function (listTitle, itemId) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.deleteItem(siteUrl, listTitle, itemId).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.getFeedBackQuestion = function (listTitle) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.getData(siteUrl, listTitle).then(function (result) {
                var data = [];
                if (result.d.results.length > 0) {
                    angular.forEach(result.d.results, function (item) {
                        var model = extendProperties(item);
                        model.description = model.feedbackDescription;
                        model.deleted = false;
                        model.checked = false;
                        data.push(model);
                    });
                }
                q.resolve(data);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }
        
        /* ---------------------------- Feedback ----------------------------------- */
        aishaService.prototype.createFeedback = function (listTitle, feedback) {
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Title": feedback.title,
                "SuggestionType": feedback.suggestionType,
                "FeedbackDescription": feedback.feedbackDescription,
                "FeedbackAnswer": feedback.feedbackAnswer,
                "FeedbackLink": {
                    '__metadata': { 'type': 'SP.FieldUrlValue' },
                    'Description': feedback.feedbackLink.description,
                    'Url': feedback.feedbackLink.url
                },
                "Browser": feedback.browser,
                "OperatingSystem": feedback.operatingSystem,
                "MobileDevice": feedback.mobileDevice,
                "ScreenSize": feedback.screenSize,
                "FeedbackStatus": feedback.feedbackStatus,
                "FeedbackResponse": feedback.feedbackResponse,
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.createItem(siteUrl, listTitle, item).then(function (result) {
                var data = extendProperties(result.d);
                q.resolve(data);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        };

        aishaService.prototype.editFeedback = function (listTitle, feedback) {
            var url = _spPageContextInfo.webAbsoluteUrl;
            var itemType = getItemTypeForListTitle(listTitle);
            var item = {
                "__metadata": { "type": itemType },
                "Title": feedback.title,
                "FeedbackDescription": feedback.feedbackDescription,
                "Answer01": feedback.answer01,
                "Answer02": feedback.answer02,
                "Answer03": feedback.answer03,
                "Answer04": {
                    '__metadata': { 'type': 'SP.FieldUrlValue' },
                    'Description': feedback.answer04.description,
                    'Url': feedback.answer04.url
                },
            };

            // call REST API
            var q = $q.defer();
            var self = this;
            self.editItem(url, listTitle, item).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.deleteFeedback = function (listTitle, itemId) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.deleteItem(siteUrl, listTitle, itemId).then(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }

        aishaService.prototype.getFeedBack = function (listTitle) {
            // call REST API
            var q = $q.defer();
            var self = this;
            self.getData(siteUrl, listTitle).then(function (result) {
                var data = [];
                if (result.d.results.length > 0) {
                    angular.forEach(result.d.results, function (item) {
                        var model = extendProperties(item);
                        data.push(model);
                    });
                }
                q.resolve(data);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        }
        
        /* ---------------------------- base functions ----------------------------- */
        aishaService.prototype.getData = function (siteUrl, listTitle) {                
            var listGuid = appCommon.getListIdByListTitle(listTitle);
            var url = String.format("{0}/_api/web/lists(guid'{1}')/items", siteUrl, listGuid);

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
        }

        aishaService.prototype.createItem = function (siteUrl, listTitle, item) {                
            var listGuid = appCommon.getListIdByListTitle(listTitle);
            var url = String.format("{0}/_api/web/lists(guid'{1}')/items", siteUrl, listGuid);

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

        aishaService.prototype.editItem = function (siteUrl, listTitle, item) {
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

        aishaService.prototype.deleteItem = function (siteUrl, listTitle, itemId) {                
            var listGuid = appCommon.getListIdByListTitle(listTitle);
            var url = String.format("{0}/_api/web/lists(guid'{1}')/items({2})", siteUrl, listGuid, itemId);

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

        aishaService.prototype.uploadFiles = function (uri, files) {
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

        aishaService.prototype.attachFileToList = function (uri, fileName, data) {
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

        return new aishaService;
    }])
    .factory('fileService', ['$q', function ($q) {
        /**
	    * CONSTRUCTOR
	    */
        var fileService = function () {
            this._sizeOfOneFile = 5242880;
            this._sizeOfTotalFile = 26214400;
            this._fileType = [];
        }

        /**
        * STATIC INTERNAL METHODS
        */
        fileService.prototype.readFileAsBinaryString = function (file) {
            var deferred = $q.defer();
            var reader = new FileReader();

            reader.onload = function () {
                file.binaryData = reader.result;
                deferred.resolve(file);
            };

            reader.onerror = function () {
                deferred.reject(reader);
            };
            reader.readAsArrayBuffer(file);
            return deferred.promise;
        };

        fileService.prototype.readFileAsBase64String = function (file) {
            function base64ToBinary(base64EncodedFile) {
                var BASE64_MARKER = ';base64,';
                var base64Index = base64EncodedFile.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                var base64 = base64EncodedFile.substring(base64Index);
                var raw = atob(base64);
                var rawLength = raw.length;
                var array = new Uint8Array(rawLength);
                var i;

                for (i = 0; i < rawLength; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                return array.buffer;
            }

            function processImage() {
                //The image file has been read by the filereader
                //and can be converted to an arraybuffer
                var arrayBuffer = base64ToBinary(this.result);

                //Upload the image to the SharePoint images library
                file.binaryData = arrayBuffer;
                deferred.resolve(file);
            }

            var deferred = $q.defer(),
                reader = new FileReader();

            reader.onload = processImage;

            reader.onerror = function () {
                deferred.reject(reader);
            };

            reader.readAsDataURL(file);
            return deferred.promise;
        };


        /**
         * PUBLIC METHODS
         */
        fileService.prototype.checkSpecialCharacters = function (files) {
            /* there are unallowed characters : ? < > # % / \ */
            var result = true,
                temp,
                pattern = new RegExp('[\\~#%&*{}/:<>?|\()"]');

            if (files instanceof Array) {
                angular.forEach(files, function (item) {
                    temp = item.name || '';
                    if (pattern.test(temp))
                        result = false;
                })
            };

            return result;
        };

        fileService.prototype.checkFileNameMaxLength = function (files) {
            var result = true;
            if (files instanceof Array) {
                angular.forEach(files, function (item) {
                    if (item.name.length > 100) result = false;
                });
            };
            return result;
        };

        fileService.prototype.checkFileTypes = function (files) {
            // there are allowed types : 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4'
            var result = true,
                temp,
                pattern = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(.pdf|.doc|.docx|.xls|.xlsx|.jpg|.jpeg|.png)$");

            if (files instanceof Array) {
                angular.forEach(files, function (item) {
                    temp = item.name || '';
                    if (!pattern.test(temp))
                        result = false;
                })
            };

            return result;
        };

        fileService.prototype.checkFileSize = function (file) {
            var result = false, temp;

            if (file instanceof Object) {
                temp = file.size || 0;
                if (this._sizeOfOneFile >= temp) { result = true; };
            };

            return result;
        };

        fileService.prototype.checkTotalFileSize = function (files) {
            var result = false, temp, total = 0;

            if (files instanceof Array) {
                angular.forEach(files, function (item) {
                    temp = item.size || 0;
                    total += temp;
                })
                if (this._sizeOfTotalFile >= total) { result = true; };
            };

            return result;
        };

        fileService.prototype.loadFiles = function (files) {
            var promises = [],
                length = files.length,
                i = 0,
                self = this;

            if (length <= 0) {
                return [];
            };

            angular.forEach(files, function (file) {
                if (file.type.indexOf('image') >= 0) {
                    promises.push(self.readFileAsBase64String(file));
                } else {
                    promises.push(self.readFileAsBinaryString(file));
                }
            });

            return $q.all(promises);
        };

        return new fileService;
    }]);
})();
