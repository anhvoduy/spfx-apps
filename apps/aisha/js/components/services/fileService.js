(function () {
    'use strict';
    angular.module('aisha.services.fileService', ['aisha.common', 'aisha.services.baseService'])    
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
