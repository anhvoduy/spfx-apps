"use strict";
var CONSTANTS = require('../logic/constants');

var Q = require('q');
var _ = require('lodash');
var throat = require('throat');
var moment = require('moment');
var hash = require('string-hash');
var config = require('../config');
var cm = require('../lib/commonmariasql.js');
var cu = require('../lib/commonutil.js');
var ce = require('../lib/commonemail.js');
var storage = require('../lib/commonstorage.js');
var commonexcel = require('../lib/commonexcel.js');

var lcat = require('./logiccategory.js');
var li = require('./logicinventory.js');
var lr = require('../logic/logicrabbitmq.js');
var path = require('path');

const MAX_SUB_CATEGORY_NUM = 5;
const ALLOWED_CATEGORY_MIN_LEVEL = 3;

var patternValidateColor = /^[^-\/\\\0`*|;\'":\<\>\{\}\#\$\+\%\!\?\=\@]{1}[^\/\\\0`*|;\'":\<\>\{\}\#\$\+\%\!\?\=\@]{0,149}$/i;
var logGroup = "product";
var Factory = {};

/**
 * Check if Sku within sales period
 *
 * @param {object} Sku - Sku object
 * @return {boolean} IsSale flag
 */
Factory.checkIsSale = function(iProd) {
    var rd = moment();
    return ~~(
        iProd.PriceSale && iProd.PriceSale > 0 &&
        (!cu.isValidDate(iProd.SaleFrom) || moment(iProd.SaleFrom) <= rd) &&
        (!cu.isValidDate(iProd.SaleTo) || moment(iProd.SaleTo) >= rd)
    );
}

var SkuListQuery = function () {
    var fields = "s.SkuId, s.StyleCode, s.SkuCode, s.Barcode, s.BrandId, s.BadgeId, s.SeasonId, s.SizeId, s.ColorId, s.GeoCountryId, " +
        "s.LaunchYear, s.PriceRetail, s.PriceSale, s.SaleFrom, s.SaleTo, s.AvailableFrom, s.AvailableTo, s.LastModified, s.LastCreated, " +
        "s.QtySafetyThreshold, s.MerchantId,s.StatusId, szc.SizeName, " +
        "sg.SizeGroupId, sg.SizeGroupCode, sgc.SizeGroupName, " +
        "s.ColorKey, cl.ColorCode, cl.ColorImage, clc.ColorName, scu.SkuColor, scu.SkuName, s.SkuNameInvariant,s.DisplayRanking, scu.SkuSizeComment, s.SkuSizeCommentInvariant, s.IsDefault," +
        // "COUNT(inv.SkuId) AS LocationCount, " +
        "s.InventoryLocationCount AS LocationCount, " +
        // "IF(SUM(inv.IsPerpetual), :PerpetualAllocationNo, (SUM(inv.QtyAssigned) - SUM(inv.QtyConfirmed) - SUM(inv.QtyOrdered)  - SUM(s.QtySafetyThreshold) - SUM(inv.InventoryLocationSafetyThreshold))) as QtyAts ";
        "IF(SUM(inv.IsPerpetual), :PerpetualAllocationNo, (SUM(inv.QtyAssigned - inv.QtyConfirmed - inv.QtyOrdered - s.QtySafetyThreshold - inv.InventoryLocationSafetyThreshold))) as QtyAts ";

    var sql = "SELECT {fields} FROM Sku s " +
        "INNER join SkuCulture scu on (s.SkuId=scu.SkuId and scu.CultureCode=:CultureCode) " +
        "INNER join Size sz on (s.SizeId=sz.SizeId) " +
        "INNER join SizeCulture szc on (sz.SizeId=szc.SizeId and szc.CultureCode=:CultureCode) " +
        "INNER join SizeGroup sg on sg.SizeGroupId=sz.SizeGroupId " +
        "INNER join SizeGroupCulture sgc on (sg.SizeGroupId=sgc.SizeGroupId and sgc.CultureCode=:CultureCode) " +
        "INNER join Color cl on (s.ColorId=cl.ColorId) " +
        "INNER join ColorCulture clc on (cl.ColorId=clc.ColorId and clc.CultureCode=:CultureCode) " +
        "LEFT JOIN Inventory inv ON s.SkuId = inv.SkuId AND inv.StatusId = 2 " +
        //"LEFT JOIN InventoryLocation il ON il.InventoryLocationId = inv.InventoryLocationId AND il.StatusId = 2 " +
        // "LEFT JOIN SkuCategory scat ON scat.SkuId = s.SkuId " +
        "WHERE {where}";

    this.getDataQuery = function (where, offset, limit) {
        var dataQuery = sql.replace('{fields}', fields).replace('{where}', where) + " GROUP BY s.SkuId ORDER BY s.SkuId ";
        if (typeof offset !== 'undefined' && typeof limit !== 'undefined') {
            dataQuery += ("LIMIT " + offset + "," + limit);
        }
        return dataQuery + ";";
    }

    this.getCountQuery = function (where) {
        return 'select count(*) as Total from (' + sql.replace('{fields}', 's.SkuId').replace('{where}', where) + " GROUP BY s.SkuId) a ";
    }
};

var SkuManager = function () {
    /**
     * Reset IsDefault flag AS 0 of other StyleCode's Skus which the IsDefault flag is 1
     *
     * @param {Connection} tr - Connection object
     * @param {Object} sku - SkuObject

     var unsetOtherIsDefault = Q.async(function *(tr, sku) {
        if (cu.isTrue(sku.Overwrite)) {
            var Bale = {
                SkuCode: sku.SkuCode,
                StyleCode: sku.StyleCode,
                MerchantId: sku.MerchantId
            };
            var unsetIsDefaultQuery = "UPDATE Sku SET IsDefault = 0 WHERE SkuCode <> :SkuCode AND StyleCode = :StyleCode AND MerchantId = :MerchantId AND StatusId <> 1 AND IsDefault = 1";
            yield tr.queryExecute(unsetIsDefaultQuery, Bale);
        }
    });
     */

    this.deleteSku = Q.async(function *(tr, sku) {
        var r1 = (yield tr.queryExecute(`UPDATE Sku SET StatusId = ${CONSTANTS.STATUS.DELETED} WHERE SkuId = :SkuId`, sku)).affectedRows;
        //var r2 = (yield tr.queryExecute(`UPDATE SkuCulture SET StatusId = ${CONSTANTS.STATUS.DELETED} WHERE SkuId = :SkuId`, sku)).affectedRows;
        var r3 = (yield tr.queryExecute(`UPDATE Inventory SET StatusId = ${CONSTANTS.STATUS.DELETED} WHERE SkuId = :SkuId`, sku)).affectedRows;
        return Number(r1) + Number(r3);
    });


    this.savePrice = Q.async(function *(tr, sku) {
        var sqlQuery = "UPDATE Sku SET " +
            "PriceRetail = :PriceRetail, " +
            "PriceSale = :PriceSale, " +
            "SaleFrom = :SaleFrom, " +
            "SaleTo = :SaleTo " +
            "WHERE SkuId = :SkuId AND StatusId <> 1";

        yield tr.queryExecute(sqlQuery, sku);
    });

    /**
     * Save sku
     *
     * @param {Connection} tr - Connection object
     * @param {Object} sku - SkuObject
     */
    this.saveSku = Q.async(function *(tr, sku) {
            // Set excel reader field be null if ''
            Object.keys(sku).forEach(function (key) {
                if (cu.isBlank(sku[key]) || sku[key] === '') {
                    sku[key] = null;
                }
            });

            sku.StyleId = hash(sku.MerchantId + '-' + sku.StyleCode);

            if (sku.isNew) {
                var sqlQuery = "INSERT INTO Sku (StyleCode,SkuCode,Barcode,BrandId,BadgeId,SeasonId,SizeId,ColorId,GeoCountryId,LaunchYear,PriceRetail,PriceSale," +
                    "SaleFrom,SaleTo,AvailableFrom,AvailableTo,StatusId,MerchantId,ColorKey, SkuNameInvariant, SkuDescInvariant, SkuSizeCommentInvariant, " +
                    "SkuColorInvariant, QtySafetyThreshold, DisplayRanking, IsDefault,StyleId) " +
                    "VALUES (:StyleCode,:SkuCode,:Barcode,:BrandId,:BadgeId,:SeasonId,:SizeId,:ColorId,:GeoCountryId,:LaunchYear,:PriceRetail,:PriceSale," +
                    ":SaleFrom,:SaleTo,:AvailableFrom,:AvailableTo,:StatusId,:MerchantId,:ColorKey,:SkuNameInvariant, :DescriptionEnglish, :SizeCommentInvariant, " +
                    ":ColorNameInvariant, :QtySafetyThreshold, :DisplayRanking, :IsDefault, :StyleId)";

                var data = yield tr.queryExecute(sqlQuery, sku);
                if (data && data.insertId) {
                    sku.SkuId = data.insertId;
                    sku.statusMessage = "inserted";
                    cu.log(logGroup, "info", "Inserted =" + sku.SkuId);
                }
            }
            else {
                if (cu.isTrue(sku.Overwrite)) {
                    if (cu.isTrue(sku.Delete)) {
                        //yield this.deleteSku(tr, sku);
                        var deletedRows = yield this.deleteSku(tr, sku);
                        if (deletedRows > 0) {
                            sku.statusMessage = "updated";
                        }
                    }
                    else 
                    {
                        // get old ColorKey
                        var sqlQuerySku = 'SELECT ColorKey FROM Sku WHERE SkuId =:SkuId AND StatusId <> 1';
                        var oldColor = yield tr.queryOne(sqlQuerySku, { SkuId: sku.SkuId });
                        // update new ColorKey to StyleImage
                        if(oldColor && oldColor.ColorKey !== sku.ColorKey){
                            var sqlStyleImage = `
                                SELECT StyleImageId 
                                FROM StyleImage 
                                WHERE MerchantId = :MerchantId AND 
                                    ImageTypeCode = 'Color' AND 
                                    StyleCode = :StyleCode AND 
                                    ColorKey = :ColorKey AND 
                                    StatusId <> 1
                            `;
                            var StyleImageIds = yield tr.queryMany(sqlStyleImage, {
                                MerchantId: sku.MerchantId,
                                StyleCode: sku.StyleCode,
                                ColorKey: oldColor.ColorKey
                            });
                            if (Array.isArray(StyleImageIds) && StyleImageIds.length > 0) {
                                yield tr.queryExecute('UPDATE StyleImage SET ColorKey=:ColorKey WHERE StyleImageId IN (:StyleImageIds)',{
                                    ColorKey: sku.ColorKey,
                                    StyleImageIds: _.map(StyleImageIds, 'StyleImageId')
                                });
                            }
                        }

                        var sqlQuery = "UPDATE Sku SET " +
                            "StyleCode =:StyleCode," +
                            "SkuCode =:SkuCode," +

                            "Barcode =:Barcode," +

                            "BrandId =:BrandId," +
                            "BadgeId =:BadgeId," +
                            "SeasonId =:SeasonId," +
                            "SizeId =:SizeId," +
                            "ColorId =:ColorId," +
                            "GeoCountryId =:GeoCountryId," +
                            "LaunchYear =:LaunchYear," +

                            "PriceRetail =:PriceRetail," +

                            "PriceSale =:PriceSale," +

                            "SaleFrom =:SaleFrom," +
                            "SaleTo =:SaleTo," +

                            "AvailableFrom =:AvailableFrom," +
                            "AvailableTo =:AvailableTo," +
                            "StatusId =:StatusId," +
                            "MerchantId =:MerchantId," +
                            "ColorKey =:ColorKey," +

                            "SkuNameInvariant =:SkuNameInvariant," +
                            "SkuDescInvariant =:DescriptionInvariant," +
                            "SkuSizeCommentInvariant =:SizeCommentInvariant," +
                            "SkuColorInvariant =:ColorNameInvariant," +

                            "QtySafetyThreshold =:QtySafetyThreshold," +
                            "DisplayRanking =:DisplayRanking," +
                            "IsDefault =:IsDefault, " +
                            "StyleId = :StyleId " +
                            "WHERE SkuId=:SkuId"; //AND MerchantId=:MerchantId

                        var data = yield tr.queryExecute(sqlQuery, sku);
                        if (data) {
                            sku.statusMessage = "updated";
                            cu.log(logGroup, "info", "Updated =" + sku.SkuId);
                        }
                    }
                } else {
                    // Overwrite set to false, nothing else to do. resolve promise chain.
                    sku.statusMessage = "skipped";
                }
            }

            if (sku.SkuId) {

                if (!sku.isNew) {
                    var SkuCategoryIds = yield tr.queryMany('SELECT SkuCategoryId FROM SkuCategory WHERE SkuId=:SkuId', {SkuId: sku.SkuId});
                    if (Array.isArray(SkuCategoryIds) && SkuCategoryIds.length > 0) {
                        yield tr.queryExecute("DELETE FROM SkuCategory WHERE SkuCategoryId IN (:SkuCategoryIds)", {
                            SkuCategoryIds: _.map(SkuCategoryIds, 'SkuCategoryId')
                        });
                    }

                    var SkuCultureIds = yield tr.queryMany('SELECT SkuCultureId FROM SkuCulture WHERE SkuId=:SkuId', {SkuId: sku.SkuId});
                    if (Array.isArray(SkuCultureIds) && SkuCultureIds.length > 0) {
                        yield tr.queryExecute("DELETE FROM SkuCulture WHERE SkuCultureId IN (:SkuCultureIds)", {
                            SkuCultureIds: _.map(SkuCultureIds, 'SkuCultureId')
                        });
                    }
                }

                for (var cInd = 0; cInd <= MAX_SUB_CATEGORY_NUM; cInd++) {
                    var catId = sku['CategoryId' + cInd];
                    if (!cu.isBlank(catId)) {
                        yield tr.queryExecute("insert into SkuCategory (SkuId,CategoryId,Priority, StatusId) values(:SkuId,:CategoryId,:Priority, 2)", {
                            SkuId: sku.SkuId,
                            CategoryId: catId,
                            Priority: cInd
                        })
                    }
                }

                var cultureCodes = Object.keys(CONSTANTS.CULTURE_CODE);
                for (var cultureCode of cultureCodes) {
                    var SkuName = sku['SkuName-' + cultureCode];
                    var SkuColor = cu.formatSkuColor(sku['ColorName-' + cultureCode]);
                    var SkuDesc = sku['Description-' + cultureCode];
                    var SkuSizeComment = sku['SizeComment-' + cultureCode];

                    yield tr.queryExecute("insert into SkuCulture (SkuId,CultureCode,SkuName,SkuDesc,SkuSizeComment,SkuColor) values(:SkuId,:CultureCode,:SkuName,:SkuDesc,:SkuSizeComment,:SkuColor)", {
                        SkuId: sku.SkuId,
                        CultureCode: cultureCode,
                        SkuName: SkuName,
                        SkuDesc: SkuDesc,
                        SkuSizeComment: SkuSizeComment,
                        SkuColor: SkuColor
                    });
                }

                if (cu.isTrue(sku.IsDefault)) {
                    //yield unsetOtherIsDefault(tr, sku);
                    if (cu.isTrue(sku.Overwrite)) {
                        var Params = {
                            //we had cases where the Stylecode was being treated as a number and thus not using the index so convert string to strings and ints to ints here
                            SkuId: parseInt(sku.SkuId),
                            StyleCode: String(sku.StyleCode),
                            MerchantId: parseInt(sku.MerchantId)
                        };
                        
                        var UnDefaultSkuIds = yield tr.queryMany(`SELECT SkuId FROM Sku WHERE MerchantId = :MerchantId AND StyleCode = :StyleCode AND StatusId <> 1 AND IsDefault = 1 AND SkuId <> :SkuId`, Params);
                        if (Array.isArray(UnDefaultSkuIds) && UnDefaultSkuIds.length > 0) {
                            yield tr.queryExecute('UPDATE Sku SET IsDefault = 0 WHERE SkuId IN (:UnDefaultSkuIds)', {
                                UnDefaultSkuIds: _.map(UnDefaultSkuIds, 'SkuId')
                            });
                        }
                    }
                }
            }
        }
    )
}


var SkuValidator = function () {
    var setErr = function (obj, appCode, errField, messageField, errorCols) {
        var execlErrCode = null;
        var message = null;

        switch (appCode) {
            case 'MSG_ERR_REQUIRED_FIELD_MISSING':
                execlErrCode = CONSTANTS.EXCEL.ERROR_CODE.MISSING;
                message = "Missing " + messageField;
                break;
            case 'MSG_ERR_FIELD_NOT_FOUND':
                execlErrCode = CONSTANTS.EXCEL.ERROR_CODE.NOT_FOUND;
                message = messageField + " not found"
                break;
            case 'MSG_ERR_INVALID_FIELD':
            default:
                execlErrCode = CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID;
                message = "Invalid " + messageField;
                break;
        }

        let exception = {
            AppCode: appCode,
            Message: message
        };

        if (errorCols) {
            setExcelErr(obj, errField, execlErrCode);
            errorCols.push(exception);
        }
        else {
            throw exception;
        }
    }

    var validateStartDateEndDate = function (obj, startDateField, endDateField, errField, errorCols) {
        var startDate = obj[startDateField];
        var endDate = obj[endDateField];

        if (!cu.isBlank(startDate) && !cu.isBlank(endDate)
            && cu.isValidDate(startDate, [CONSTANTS.DATE_FORMAT, CONSTANTS.DB_DATE_FORMAT])
            && cu.isValidDate(endDate, [CONSTANTS.DATE_FORMAT, CONSTANTS.DB_DATE_FORMAT])
            && moment(startDate) && !moment(startDate).isSameOrBefore(endDate)
        ) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', errField, errField, errorCols);
        }
    }

    var validateDate = function (obj, field, isAllowBlank, errorCols) {
        var fieldVal = obj[field];
        if (!isAllowBlank && cu.isBlank(fieldVal)) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', errField, errField, errorCols);
        }

        if (!cu.isBlank(fieldVal) && !cu.isValidDate(fieldVal, [CONSTANTS.DATE_FORMAT, CONSTANTS.DB_DATE_FORMAT])) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', field, field, errorCols);
        }
    }

    var validateYear = function (obj, field, isAllowBlank, errorCols) {
        var fieldVal = obj[field];
        if (!isAllowBlank && cu.isBlank(fieldVal)) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', errField, errField, errorCols);
        }

        if (!cu.isBlank(fieldVal) && !cu.isValidDate(fieldVal, ['YYYY'])) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', field, field, errorCols);
        }
    }

    var validatePrices = function (obj, retailPrice, salePrice, errorCols) {

        validateFloat(obj, retailPrice, false, 0, 9999999, errorCols, true);
        validateFloat(obj, salePrice, true, 0, obj[retailPrice], errorCols, true);

        var retailPriceVal = parseFloat(obj[retailPrice]);
        var salePriceVal = parseFloat(obj[salePrice]);


        if (!isNaN(salePriceVal) && (salePriceVal >= retailPriceVal)) {
            let exception = {
                AppCode: 'MSG_ERR_PRICESALE_GREATER_THAN_RETAILPRICE',
                Message: salePrice + " must not greater Or Equal to " + retailPrice
            };
            if (errorCols) {
                setExcelErr(obj, salePrice, CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID);
                errorCols.push(exception);
            }
            else {
                throw exception;
            }
        }
    }

    var validateValues = function (obj, field, isAllowBlank, values, errorCols) {
        var fieldVal = obj[field];

        if (!isAllowBlank && cu.isBlank(fieldVal)) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', field, field, errorCols);
        }

        if (!cu.isBlank(fieldVal) && (values.toString().indexOf(fieldVal) < 0)) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', field, field, errorCols);
        }
    };

    var validateNumber = function (obj, field, isAllowBlank, min, max, errorCols) {
        var fieldVal = obj[field];
        if (!isAllowBlank && cu.isBlank(fieldVal)) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', field, field, errorCols);
        }

        if (!cu.isBlank(fieldVal) && (!cu.isInteger(fieldVal) || Number(fieldVal) < min || Number(fieldVal) > max)) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', field, field, errorCols);
        }
    };

    var validateFloat = function (obj, field, isAllowBlank, min, max, errorCols, isRequireGreaterThanZero) {
        var fieldVal = obj[field];
        if (!isAllowBlank && cu.isBlank(fieldVal)) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', field, field, errorCols);
        }

        var isInvalid = isRequireGreaterThanZero ? parseFloat(fieldVal) <= 0 : parseFloat(fieldVal) < 0;
        if (!cu.isBlank(fieldVal) && (!cu.isDecimal(fieldVal, 10, 2) || isInvalid || Number(fieldVal) < min || Number(fieldVal) > max)) {
            setErr(obj, 'MSG_ERR_INVALID_FIELD', field, field, errorCols);
        }
    };

    var isMissingCodeOrId = function (obj, codeField, idField, errorCols) {
        if (cu.isBlank(obj[codeField]) && cu.isBlank(obj[idField])) {
            setErr(obj, 'MSG_ERR_REQUIRED_FIELD_MISSING', codeField, codeField + "/" + idField, errorCols);
        }
    }

    var validatePattern = function (obj, field, pattern, errorCols) {
        var fieldVal = obj[field];
        try {
            cu.validatePattern(field, fieldVal, pattern);
        }
        catch (err) {
            if (errorCols) {
                var errCode = ('MSG_ERR_REQUIRED_FIELD_MISSING' === err.AppCode) ? CONSTANTS.EXCEL.ERROR_CODE.MISSING : CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID;
                setExcelErr(obj, field, errCode);
                errorCols.push(err);
            }
            else {
                throw err;
            }
        }
    };

    var validateString = function (obj, field, maxLength, isAllowedBlank, errorCols) {
        var fieldVal = obj[field];
        try {
            cu.validateString(field, fieldVal, maxLength, isAllowedBlank);
            return true;
        }
        catch (err) {
            if (errorCols) {
                var errCode = ('MSG_ERR_REQUIRED_FIELD_MISSING' === err.AppCode) ? CONSTANTS.EXCEL.ERROR_CODE.MISSING : CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID;
                setExcelErr(obj, field, errCode);
                errorCols.push(err);
            }
            else {
                throw err;
            }
        }
		return false;
    };

    var validateSuccessiveData = function (obj, field, maxLength, errorCols) {
        for (var index = 1; index <= maxLength; index++) {
            if (index !== maxLength) {
                var currentField = field + index;
                var currentData = obj[currentField];
                var nextData = obj[field + (index + 1)];
                let exception = {
                    AppCode: 'MSG_ERR_REQUIRED_FIELD_MISSING',
                    Message: "Missing " + currentField
                };

                if (cu.isBlank(currentData) && !cu.isBlank(nextData)) {
                    if (errorCols) {
                        setExcelErr(obj, field, CONSTANTS.EXCEL.ERROR_CODE.MISSING);
                        errorCols.push(exception);
                    }
                    else {
                        throw exception;
                    }
                }
            }
        }
    }

    var setExcelErr = function (obj, field, newErrCode) {
        var fieldVal = !cu.isBlank(obj[field]) ? obj[field].toString() : '';

        // if all applied excel err code is using this function, this is always only 1 errCode return
        var usedErrCodeKey = Object.keys(CONSTANTS.EXCEL.ERROR_CODE).filter(function (errCodeKey) {
                return !cu.isUndefined(fieldVal) && fieldVal.toString().indexOf(CONSTANTS.EXCEL.ERROR_CODE[errCodeKey]) > -1;
            })[0] || false;

        if (usedErrCodeKey) {
            fieldVal = fieldVal.replace(CONSTANTS.EXCEL.ERROR_CODE[usedErrCodeKey], '');
        }

        obj[field] = newErrCode + (fieldVal || '');
    }

    var runDBCheck = Q.async(function*(tr, sku, sqlQuery, errCode, errField, updateField, Bale, errorCols, messageField) {
        var data = yield tr.queryOne(sqlQuery, Bale);

        if (cu.isBlank(messageField)) {
            messageField = errField;
        }

        if (data && !cu.isBlank(data[updateField])) {
            sku[updateField] = data[updateField];
        } else {
            setErr(sku, errCode, errField, messageField, errorCols);
        }
    });

    this.validateStyle = Q.async(function*(tr, style, isStyleCodeChanged) {

        //1.1check input
        // validateString(style, 'StyleCode', 50, false);
        // validatePattern(style, 'StyleCode', (/^[a-zA-Z0-9-_.]*$/i));
        // isMissingCodeOrId(style, 'BrandCode', 'BrandId');
        //
        // validateNumber(style, 'DisplayRanking', true, 0, 9999);

        if (style.CategoryPriorityList.length === 0 || style.CategoryPriorityList.length > MAX_SUB_CATEGORY_NUM + 1) {
            throw {
                AppCode: 'MSG_ERR_CATEGORY_INVALID',
                Message: 'Category items must be greater than 0 and less then 6'
            };
        }

        for (var cInd = 0; cInd <= MAX_SUB_CATEGORY_NUM; cInd++) {
            if (!cu.isBlank(style.CategoryPriorityList[cInd]) && !cu.isBlank(style.CategoryPriorityList[cInd].CategoryId)) {
                if (cInd === 0) {
                    style['CategoryId'] = style.CategoryPriorityList[cInd].CategoryId;
                }
                style['CategoryId' + cInd] = style.CategoryPriorityList[cInd].CategoryId;
            }
            else {
                if (cInd == 0) {
                    throw {
                        AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
                        Message: 'Missing Primary category'
                    };
                }
            }
        }

        if (cu.isBlank(style.RetailPrice) && !cu.isBlank(style.PriceRetail)) {
            style.RetailPrice = style.PriceRetail;
        }

        var defaultSku = style.SkuList.filter(function (sku) {
            return sku.IsDefault === 1;
        })[0];

        if (cu.isBlank(defaultSku)) {
            throw {
                AppCode: 'MSG_ERR_SKU_ISDEFAULT',
                Message: 'Missing default sku'
            };
        }

        if (cu.isBlank(defaultSku.SkuCulture) || cu.isBlank(style.SkuCulture)) {
            throw {
                AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
                Message: 'Missing SkuCulture'
            };
        }

        if (style.SkuList.length === 0) {//At least there should be one sku
            throw {
                AppCode: 'MSG_ERR_SKU_NIL'
            };
        }

        if (isStyleCodeChanged) {
            //1.2checking if style code is unique;
            var sqlQuery = "SELECT COUNT(SkuId) COUNT FROM Sku WHERE StyleCode=:StyleCode AND MerchantId=:MerchantId AND StatusId <> 1";
            let data = yield tr.queryOne(sqlQuery, {
                StyleCode: String(style.StyleCode),
                MerchantId: parseInt(style.MerchantId)
            });

            if (data.COUNT > 0) {
                throw {
                    AppCode: 'MSG_ERR_PRODUCT_STYLECODE_UNIQUE',
                    Message: 'StyleCode is already in use!'
                };
            }
        }

        yield this.dbCheckAndSetBrandAndMerchant(tr, style);
        yield this.dbCheckAndSetBadge(tr, style);
        yield this.dbCheckAndSetSeason(tr, style);

        yield this.dbCheckAndSetGeoCountry(tr, style);
        yield this.dbCheckAndSetCategories(tr, style);

        var tmpSkuCodeArray = [];
        var tmpBarCodeArray = [];

        this.validateCommonStyleAndSkuFields(style);
        this.validatePriceInfo(style, 'RetailPrice', 'PriceSale', 'SaleFrom', 'SaleTo', 'AvailableFrom', 'AvailableTo');

        var pickFields = ['StyleCode',
            'MerchantId',
            'SaleFrom',
            'SaleTo',
            'AvailableFrom',
            'AvailableTo',
            'LaunchYear',
            'BrandId',
            'SeasonId',
            'BadgeId',
            'GeoCountryId',
            'DisplayRanking',
            'CategoryId',
            'RetailPrice'];

        for (var catNo = 0; catNo <= MAX_SUB_CATEGORY_NUM; catNo++) {
            pickFields.push('CategoryId' + catNo);
        }

        var skuList = [],
            pickedStyle = _.pick(style, pickFields);

        for (var sku of style.SkuList) {
            var styleSku = _.extend({}, sku, pickedStyle);
            sku = _.extend(styleSku, sku);
            // sku = _.extend({}, sku, pickedStyle);

            // todo: align saleForm and SalePriceFrom, special handling only
            sku.SalePriceFrom = style.SaleFrom;
            sku.SalePriceTo = style.SaleTo;

            if (!(sku.AvailableFrom || sku.AvailableTo)) {
                sku.AvailableFrom = style.AvailableFrom;
                sku.AvailableTo = style.AvailableTo;
            }

            sku.isNew = cu.isBlank(sku.SkuId);
            sku.Overwrite = true;

            this.validateSkuBaseFields(sku);

            for (var cultureCode of Object.keys(CONSTANTS.CULTURE_CODE)) {
                //Merge Style.SkuCulture to Sku.SkuCulture
                var pickedStyleSkuCulture = _.pick(style.SkuCulture[cultureCode], ['SkuName', 'SkuDesc', 'SkuSizeComment']);
                sku.SkuCulture[cultureCode] = _.extend({}, sku.SkuCulture[cultureCode], pickedStyleSkuCulture);

                var fieldMap = {
                    'SkuName': 'SkuName',
                    'Description': 'SkuDesc',
                    'SizeComment': 'SkuSizeComment',
                    'ColorName': 'SkuColor'
                };

                Object.keys(fieldMap).forEach(function (dataField) {
                    let objField = fieldMap[dataField];
                    let fieldVal = sku.SkuCulture[cultureCode][objField];
                    sku[dataField + '-' + cultureCode] = fieldVal;
                });

                this.validateCommonCultureFields(sku, cultureCode);
            }

            if (cu.isBlank(sku['SizeId'])) {
                validateString(sku, 'SizeCode', 255, false);
                validateString(sku, 'SizeGroupCode', 255, false);
            }

            yield this.dbCheckAndSetSize(tr, sku);
            yield this.dbCheckAndSetColor(tr, sku);

            setSkuDefaultVal(sku);

            if (tmpSkuCodeArray.indexOf(sku.SkuCode) == -1) {
                tmpSkuCodeArray.push(sku.SkuCode);
            } else {
                throw {
                    AppCode: 'MSG_ERR_SKU_EXISTED',
                    Message: {SkuCode: sku.SkuCode}
                };
            }

            if (!cu.isBlank(sku.Barcode)) {
                let exception = {
                    AppCode: 'MSG_ERR_PRODUCT_BARCODE_UNIQUE_WITHIN_MERCHANT',
                    Message: {Barcode: sku.Barcode}
                };

                if (tmpBarCodeArray.indexOf(sku.Barcode) == -1) {
                    tmpBarCodeArray.push(sku.Barcode);
                } else {
                    throw exception;
                }

                var checkValidBarcode = yield this.dbCheckBarcodeUniqueWithinMerchant(tr, sku);

                if (!checkValidBarcode) {
                    throw exception;
                }
            }

            // skuId related checking
            if (!cu.isBlank(sku.SkuId)) {
                let data = yield tr.queryOne('select SkuId from Sku where SkuId=:SkuId and StatusId=:StatusId',
                    {SkuId: sku.SkuId, StatusId: CONSTANTS.STATUS.DELETED});

                if (data) {
                    throw {
                        AppCode: 'MSG_ERR_PRODUCT_NOT_FOUND',
                        Message: 'Product is already deleted!'
                    };
                }
            }

            var checkValidSkuCode = yield this.dbCheckSkuCodeUniqueWithinMerchant(tr, sku);

            if (!checkValidSkuCode) {
                throw {
                    AppCode: 'MSG_ERR_PRODUCT_SKUCODE_UNIQUE_WITHIN_MERCHANT',
                    Message: {SkuCode: sku.SkuCode}
                };
            }

            var validStatusIds = [CONSTANTS.STATUS.ACTIVE, CONSTANTS.STATUS.PENDING, CONSTANTS.STATUS.INACTIVE];
            // Validate Sku status
            if (!cu.isBlank(sku.StatusId) && validStatusIds.indexOf(sku.StatusId) < 0) {
                throw {
                    AppCode: "MSG_ERR_SKU_STATUS_UNKNOWN",
                    Message: "Unknown Sku status"
                };
            }

            skuList.push(sku);
        }

        //limit Description Images validation
        if (style.DescriptionImageList.length === 0 && style.StatusId !== CONSTANTS.STATUS.PENDING) {
            throw {
                AppCode: 'MSG_ERR_PRODUCT_DESCRIPTION_IMAGES_REQUIRED',
                Message: 'Description images are required!'
            };
        }

        if (style.DescriptionImageList.length > CONSTANTS.STYLE_VALIDATE.MAX_DESCRIPTION_IMAGES) {
            throw {
                AppCode: 'MSG_ERR_PRODUCT_DESCRIPTION_IMAGES_EXCEED_LIMIT',
                Message: 'Description images limit exceed!'
            };
        }

        let defaultSkuColorImageList = style.ColorImageListMap[_.findKey(style.ColorImageListMap, function(value, key) { return cu.formatColorKey(key) === cu.formatColorKey(defaultSku.ColorKey);})];
        let hasDefaultSkuColorImage =
            Object.prototype.hasOwnProperty.call(style, 'ColorImageListMap')
            && Object.prototype.hasOwnProperty.call(defaultSku, 'ColorKey')
            && !cu.isBlank(defaultSkuColorImageList)
            && cu.hasChild(defaultSkuColorImageList.filter(function (colorImage) {
                return Object.prototype.hasOwnProperty.call(colorImage, 'ColorKey')
                    && cu.formatColorKey(colorImage.ColorKey) === cu.formatColorKey(defaultSku.ColorKey);
            }));

        if (style.StatusId === CONSTANTS.STATUS.ACTIVE && !hasDefaultSkuColorImage) {
            throw {
                AppCode: 'MSG_ERR_PRODUCT_DEFAULT_COLOR_IMAGES_REQUIRED',
                Message: 'Default sku color image is required.'
            };
        }

        if (style.ColorImageListMap) {
            Object.keys(style.ColorImageListMap).forEach(function (key) {
                if (style.ColorImageListMap[key].length > CONSTANTS.STYLE_VALIDATE.MAX_COLOR_IMAGES)
                    throw {
                        AppCode: 'MSG_ERR_PRODUCT_COLOR_IMAGES_EXCEED_LIMIT',
                        Message: 'Color images limit exceed!'
                    };
            })
        }
        style.SkuList = skuList;
    });

    this.validateDeleteSku = Q.async(function*(tr, sku, errorCols) {
        var sql = 'SELECT count(SkuId) TotalNum FROM Inventory where SkuId=:SkuId AND (QtyAssigned > 0 OR IsPerpetual = 1);';
        yield tr.queryOne(sql, {SkuId: sku.SkuId}).then(function (data) {
            if (data.TotalNum > 0) {
                let exception = {AppCode: 'MSG_ERR_PRODUCT_HAS_INVENTORY', Message: "Delete"};
                if (errorCols) {
                    sku["Delete"] = CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID + sku["Delete"];
                    errorCols.push(exception);
                }
                else {
                    throw exception;
                }
            }
        });
    });

    this.validatePriceInfo = function (sku, retailPriceField, priceSaleField, salePriceFromField, salePriceToField, availableFromField, availableToField, errorCols) {
        
        if (
            !cu.isBlank(sku[salePriceFromField]) || 
            !cu.isBlank(sku[salePriceToField])
        ) {
            
            validateDate(sku, salePriceFromField, true, errorCols);
            validateDate(sku, salePriceToField, true, errorCols);

            validateStartDateEndDate(sku, salePriceFromField, salePriceToField, salePriceFromField, errorCols);
            validateStartDateEndDate(sku, availableFromField, salePriceFromField, salePriceFromField, errorCols);
            validateStartDateEndDate(sku, salePriceFromField, availableToField, salePriceFromField, errorCols);

            validateStartDateEndDate(sku, salePriceToField, availableToField, salePriceToField, errorCols);
            validateStartDateEndDate(sku, availableFromField, salePriceToField, salePriceToField, errorCols);
        }

        validateStartDateEndDate(sku, availableFromField, availableToField, availableFromField, errorCols);

        validatePrices(sku, retailPriceField, priceSaleField, errorCols);
    };

    this.validateCommonCultureFields = function (sku, cultureCode, errorCols) {
        validateString(sku, 'SkuName-' + cultureCode, 255, false, errorCols);

        if ((!cu.isBlank(sku['ColorCode']) && sku['ColorCode'] !== '0') || 
            (!cu.checkIdBlank(sku["ColorId"]) && sku['ColorId'] > 0)) {
            validateString(sku, 'ColorName-' + cultureCode, 150, false, errorCols);
            //validatePattern(sku, 'ColorName-' + cultureCode, patternValidateColor, errorCols);
        }

        validateString(sku, 'Description-' + cultureCode, 1500, true, errorCols);
        validateString(sku, 'SizeComment-' + cultureCode, 1000, true, errorCols);
    };

    this.validateSkuBaseFields = function (sku, errorCols) {
        validateString(sku, 'SkuCode', 64, false, errorCols);
        // validatePattern(sku, 'SkuCode', (/^[a-zA-Z0-9-_.]*$/i), errorCols);

        validateString(sku, 'Barcode', 64, true, errorCols);

        var isImport = cu.isTrue(sku.IsImport);
        // Color Checker
        validateString(sku, 'ColorCode', 255, isImport ? false : true, errorCols);

        validateValues(sku, 'IsDefault', !isImport, ["0", "1"], errorCols);
        // relax color key and let the system set it afterwards
        // validatePattern(sku, 'ColorKey', patternValidateColor, errorCols);
    };

    this.validateCommonStyleAndSkuFields = function (sku, errorCols) {

        if (validateString(sku, 'StyleCode', 50, false, errorCols))
            validatePattern(sku, 'StyleCode', (/^[a-zA-Z0-9-_.]*$/i), errorCols);

        isMissingCodeOrId(sku, 'BrandCode', 'BrandId', errorCols);
        validateNumber(sku, 'DisplayRanking', true, 0, 9999, errorCols);

        validateYear(sku, 'LaunchYear', true, errorCols);
        validateDate(sku, 'AvailableFrom', true, errorCols);
        validateDate(sku, 'AvailableTo', true, errorCols);

    };

    this.validateBasicFormat = function (sku, errorCols) {
        this.validateCommonStyleAndSkuFields(sku, errorCols);
        this.validatePriceInfo(sku, 'RetailPrice', 'PriceSale', 'SalePriceFrom', 'SalePriceTo', 'AvailableFrom', 'AvailableTo', errorCols);

        this.validateSkuBaseFields(sku, errorCols);
        validateNumber(sku, 'QtySafetyThreshold', true, 0, 9999999, errorCols);

        isMissingCodeOrId(sku, 'PrimaryCategoryCode', 'CategoryId', errorCols);
        validateSuccessiveData(sku, 'MerchandisingCategoryCode', MAX_SUB_CATEGORY_NUM, errorCols);

        for (var cultureCode of Object.keys(CONSTANTS.CULTURE_CODE)) {
            this.validateCommonCultureFields(sku, cultureCode, errorCols);
        }
    };

    this.dbCheckIsDefault = Q.async(function*(tr, sku, errorCols) {
        // check sku can be set is default
        // if isNew,
        //      if set isDefault = 0
        //          if this is not any isDefault sku in same style,
        //              set error
        //      if set isDefault = 1 & is not overwrite
        //          if this is another isDefault sku in the same style
        //              set error
        // if Overwrite
        //      if set isDefault = 0
        //           if this is not any isDefault sku in same style,
        //              set error
        //      if set isDefault = 1, ok
        // if not overwrite and not isNew, skip

        var sqlQuery = null,
            Bale = {
                MerchantId: parseInt(sku.MerchantId),
                StyleCode: String(sku.StyleCode),
                SkuCode: String(sku.SkuCode)
            },
            errCode = 'MSG_ERR_INVALID_FIELD',
            errField = 'IsDefault';

        if (sku.isNew) {
            // if IsDefault set 1, see if same StyleCode sku have only this IsDefault Sku only
            if (!cu.isTrue(sku.Overwrite) && cu.isTrue(sku.IsDefault)) {
                sqlQuery = "SELECT SkuCode FROM Sku WHERE MerchantId = :MerchantId AND StyleCode = :StyleCode AND StatusId <> 1 AND IsDefault = 1";
                var skus = yield tr.queryMany(sqlQuery, Bale);
                if (skus && (skus.length > 1 || (skus.length === 1 && (skus[0].SkuCode !== sku.SkuCode)))) {
                    setErr(sku, errCode, errField, errField, errorCols);
                }
            }
        }

        if (sku.isNew || cu.isTrue(sku.Overwrite)) {
            // If IsDefault set 0, see if same StyleCode sku have another IsDefault sku already
            if (Number(sku.IsDefault) === 0) {
                sqlQuery = "SELECT COUNT(SkuId) AS COUNT FROM Sku WHERE MerchantId = :MerchantId AND StyleCode = :StyleCode AND StatusId <> 1 AND SkuCode <> :SkuCode AND IsDefault = 1";
                var data = yield tr.queryOne(sqlQuery, Bale);
                if (data && data.COUNT === 0) {
                    // Set current default if no existing default sku
                    sku.IsDefault = 1;
                }
            }
        }
    });

    this.dbCheckAndSetBrandAndMerchant = Q.async(function*(tr, sku, errorCols) {
        var hasBrandId = !cu.isBlank(sku.BrandId);
        var hasBrandCode = !cu.isBlank(sku.BrandCode) && String(sku.BrandCode).indexOf(':MISSING:') <= -1;

        if (cu.isBlank(sku.MerchantId)) {
            throw {
                AppCode: "MSG_ERR_REQUIRED_FIELD_MISSING",
                Message: 'Missing MerchantId'
            };
        }

        if (hasBrandId || hasBrandCode) {
            var Bale = {
                MerchantId: sku.MerchantId
            };

            var errField = null;

            var sqlQuery = "SELECT b.BrandId FROM Brand b, MerchantBrand mb WHERE b.BrandId=mb.BrandId AND mb.MerchantId=:MerchantId AND ";

            if (hasBrandId) {
                sqlQuery += 'b.BrandId=:BrandId';
                Bale.BrandId = sku.BrandId;
                errField = 'BrandId';
            }
            else if (hasBrandCode) {
                sqlQuery += 'b.BrandCode=:BrandCode';
                Bale.BrandCode = sku.BrandCode;
                errField = 'BrandCode';
            }
            sqlQuery += " AND b.StatusId in (2, 4)";

            yield runDBCheck(tr, sku, sqlQuery, 'MSG_ERR_FIELD_NOT_FOUND', errField, 'BrandId', Bale, errorCols, 'BrandId or MerchantId');
        }
        else {
            sku.BrandId = 0;
        }
    });

    this.dbCheckAndSetBadge = Q.async(function*(tr, sku, errorCols) {
        var hasBadgeId = !cu.isBlank(sku.BadgeId);
        var hasBadgeCode = !cu.isBlank(sku.BadgeCode) && String(sku.BadgeCode).indexOf(':MISSING:') <= -1;

        if (hasBadgeId || hasBadgeCode) {
            var Bale = {},
                errField = null,
                errCode = null,
                sqlQuery = "SELECT BadgeId FROM Badge WHERE ";

            if (hasBadgeId) {
                sqlQuery += 'BadgeId=:BadgeId';
                Bale.BadgeId = sku.BadgeId;
                errField = 'BadgeId';
                errCode = 'MSG_ERR_INVALID_FIELD';
            }
            else if (hasBadgeCode) {
                sqlQuery += 'BadgeCode=:BadgeCode';
                Bale.BadgeCode = sku.BadgeCode;
                errField = 'BadgeCode';
                errCode = 'MSG_ERR_FIELD_NOT_FOUND';
            }

            yield runDBCheck(tr, sku, sqlQuery, errCode, errField, 'BadgeId', Bale, errorCols);

        }
        else {
            sku.BadgeId = 0;
        }
    });

    this.dbCheckAndSetSeason = Q.async(function*(tr, sku, errorCols) {
        var hasSeasonId = !cu.isBlank(sku.SeasonId);
        var hasSeasonCode = !cu.isBlank(sku.SeasonCode) && String(sku.SeasonCode).indexOf(':MISSING:') <= -1;

        if (hasSeasonId || hasSeasonCode) {
            var Bale = {},
                errField = null,
                errCode = null,
                sqlQuery = "SELECT SeasonId FROM Season WHERE ";

            if (hasSeasonId) {
                sqlQuery += 'SeasonId=:SeasonId';
                Bale.SeasonId = sku.SeasonId;
                errField = 'SeasonId';
                errCode = 'MSG_ERR_INVALID_FIELD';
            }
            else if (hasSeasonCode) {
                sqlQuery += 'SeasonCode=:SeasonCode';
                Bale.SeasonCode = sku.SeasonCode;
                errField = 'SeasonCode';
                errCode = 'MSG_ERR_FIELD_NOT_FOUND';
            }

            yield runDBCheck(tr, sku, sqlQuery, errCode, errField, 'SeasonId', Bale, errorCols);
        }
        else {
            sku.SeasonId = 0;
        }
    });

    this.dbCheckAndSetColor = Q.async(function*(tr, sku, errorCols) {
        var hasColorId = !cu.isBlank(sku.ColorId);
        var hasColorCode = !cu.isBlank(sku.ColorCode) && String(sku.ColorCode).indexOf(':MISSING:') <= -1;

        if (hasColorId || hasColorCode) {
            var Bale = {},
                errField = null,
                errCode = null,
                sqlQuery = "SELECT ColorId FROM Color WHERE ";

            if (hasColorId) {
                sqlQuery += 'ColorId=:ColorId';
                Bale.ColorId = sku.ColorId;
                errField = 'ColorId';
                errCode = 'MSG_ERR_INVALID_FIELD';
            }
            else if (hasColorCode) {
                sqlQuery += 'ColorCode=:ColorCode';
                Bale.ColorCode = sku.ColorCode;
                errField = 'ColorCode';
                errCode = 'MSG_ERR_FIELD_NOT_FOUND';
            }

            yield runDBCheck(tr, sku, sqlQuery, errCode, errField, 'ColorId', Bale, errorCols);

            //TODO: may be available to save 0 sizeId or 0 colorId after launch in the future
            if (sku.StatusId === CONSTANTS.STATUS.ACTIVE)
                validateNumber(sku, 'ColorId', true, 1, 9999999999, errorCols);

            // set ColorKey
            if (((!cu.isBlank(sku["ColorCode"]) && sku["ColorCode"] !== '0') || !cu.checkIdBlank(sku["ColorId"])) && !cu.isBlank(sku["ColorName-EN"])) {
                sku.ColorKey = cu.formatColorKey(Factory.compactFilename(sku["ColorName-EN"].toString()));
            }
        }
        else {
            let errorField = !hasColorCode ? 'ColorCode' : 'ColorId';
            setErr(sku, 'MSG_ERR_REQUIRED_FIELD_MISSING', errorField, errorField, errorCols);
        }

    });

    this.dbCheckColorNameBySizeCode = Q.async(function* (tr, sku, errorCols) {
        var hasStyleCode = !cu.isBlank(sku.StyleCode);
        var hasColorId = !cu.isBlank(sku.ColorId);
        var hasColorCode = !cu.isBlank(sku.ColorCode) && String(sku.ColorCode).indexOf(':MISSING:') <= -1;
        var hasSizeId = !cu.isBlank(sku.SizeId) && String(sku.SizeId).indexOf(':MISSING:') <= -1;
        var hasSizeCode = !cu.isBlank(sku.SizeCode) && String(sku.SizeCode).indexOf(':MISSING:') <= -1;
        var hasColorNameEN = !cu.isBlank(sku['ColorName-EN']) && String(sku['ColorName-EN']).indexOf(':MISSING:') <= -1;
        var hasColorNameCHS = !cu.isBlank(sku['ColorName-CHS']) && String(sku['ColorName-CHS']).indexOf(':MISSING:') <= -1;
        var hasColorNameCHT = !cu.isBlank(sku['ColorName-CHT']) && String(sku['ColorName-CHT']).indexOf(':MISSING:') <= -1;

        var Bale = {}, data = {}, sqlQuery = '', errField, errCode;
        var cultureCodes = ['EN', 'CHS', 'CHT'];

        // MM-24957 + MM-30580: same colour code and size code should not have same colour name (in same style)
        if (hasStyleCode && hasColorId && hasColorCode &&
            hasSizeId && hasSizeCode &&
            hasColorNameEN && hasColorNameCHS && hasColorNameCHT) {
            sqlQuery = `
              SELECT COUNT(*) AS Count 
              FROM Sku S INNER JOIN SkuCulture SC ON S.SkuId = SC.SkuId 
              WHERE S.StyleCode = :StyleCode AND
                    S.MerchantId = :MerchantId AND
                    S.SkuCode <> :SkuCode AND
                    S.SkuId <> :SkuId AND
                    S.ColorId = :ColorId AND 
                    S.SizeId = :SizeId AND
                    SC.CultureCode = :CultureCode AND 
                    SC.SkuColor = :SkuColor
            `;
            Bale.MerchantId = parseInt(sku.MerchantId);
            Bale.StyleCode = sku.StyleCode;
            Bale.SkuCode = sku.SkuCode;
            Bale.SkuId = cu.isTrue(sku.isNew) ? 0 : parseInt(sku.SkuId);
            Bale.ColorId = sku.ColorId;
            Bale.ColorCode = sku.ColorCode;
            Bale.SizeId = sku.SizeId;
            Bale.SizeCode = sku.SizeCode;
                        
            for(var cc of cultureCodes){
                Bale.CultureCode = cc;
                Bale.SkuColor = cu.formatSkuColor(sku['ColorName-' + cc]);
                errField = 'ColorName-' + cc, errCode = 'MSG_ERR_INVALID_FIELD';
                data = yield tr.queryOne(sqlQuery, Bale);
                if (data.Count > 0) {
                    var errMessage = `same colour code and size code should not have same colour name: ${cc}`;
                    setErr(sku, errCode, errField, errMessage, errorCols);
                }
            }
        }
    });

    this.dbCheckAndSetGeoCountry = Q.async(function*(tr, sku, errorCols) {
        var hasGeoCountryId = !cu.isBlank(sku.GeoCountryId);
        var hasCountryOriginCode = !cu.isBlank(sku.CountryOriginCode) && String(sku.CountryOriginCode).indexOf(':MISSING:') <= -1;

        if (hasGeoCountryId || hasCountryOriginCode) {
            var Bale = {},
                errField = null,
                errCode = null,
                sqlQuery = "SELECT GeoCountryId FROM GeoCountry WHERE ";

            if (hasGeoCountryId) {
                sqlQuery += 'GeoCountryId=:GeoCountryId';
                Bale.GeoCountryId = sku.GeoCountryId;
                errField = 'GeoCountryId';
                errCode = 'MSG_ERR_INVALID_FIELD';
            }
            else if (hasCountryOriginCode) {
                sqlQuery += 'CountryCode=:CountryCode';
                Bale.CountryCode = sku.CountryOriginCode;
                errField = 'CountryOriginCode';
                errCode = 'MSG_ERR_FIELD_NOT_FOUND';
            }

            yield runDBCheck(tr, sku, sqlQuery, errCode, errField, 'GeoCountryId', Bale, errorCols);
        }
        else {
            sku.GeoCountryId = 0;
        }
    });

    this.dbCheckAndSetCategories = Q.async(function*(tr, sku, errorCols) {
        //get all categories and build tree
        var allCategories = yield lcat.listAdjacency(tr, CONSTANTS.CULTURE_CODE.CHS, true, false);
        var categoryTree = lcat.convertTree(allCategories);

        for (var cInd = 0; cInd <= MAX_SUB_CATEGORY_NUM; cInd++) {
            let catCode = null,
                catId = null,
                errField = null;

            if (cInd === 0) {
                catCode = sku['PrimaryCategoryCode'];
                catId = sku['CategoryId'];

                // for public api case, not for AC/MC flow, as sku['CategoryId0'] is input already
                if (!cu.isBlank(catId)) {
                    sku['CategoryId' + cInd] = catId;
                }

                if (!cu.isBlank(catCode)) {
                    errField = 'PrimaryCategoryCode';
                }
                else {
                    errField = 'CategoryId';
                }
            }
            else {
                catCode = sku['MerchandisingCategoryCode' + cInd];
                catId = sku['CategoryId' + cInd];
                if (!cu.isBlank(catCode)) {
                    errField = 'MerchandisingCategoryCode' + cInd;
                }
                else {
                    errField = 'CategoryId' + cInd;
                }
            }

            var statuses = [2, 3, 4];
            if (sku.IsImport) {
                statuses = [2, 4];
            }

            if (!cu.isBlank(catId) || !cu.isBlank(catCode)) {
                //check exists
                var data = lcat.findSubtree(categoryTree, cu.isBlank(catId) ? catCode : catId);
                if (!data || statuses.indexOf(data.StatusId) === -1 || cu.isBlank(data.CategoryId)) {
                    setErr(sku, 'MSG_ERR_FIELD_NOT_FOUND', errField, errField, errorCols);
                } else {
                    sku['CategoryId' + cInd] = data.CategoryId;
                    //if exists, check level
                    if(data.Level < ALLOWED_CATEGORY_MIN_LEVEL) {
                        setErr(sku, 'MSG_ERR_INVALID_FIELD', errField, errField, errorCols);
                    }
                }
            }
        }
    });

    this.dbCheckAndSetSize = Q.async(function*(tr, sku, errorCols) {
        var hasSizeId = !cu.isBlank(sku.SizeId);
        var hasSizeCode = !cu.isBlank(sku.SizeCode) && String(sku.SizeCode).indexOf(':MISSING:') <= -1;
        var hasSizeGroupCode = !cu.isBlank(sku.SizeGroupCode);

        if (hasSizeId || (hasSizeCode && hasSizeGroupCode)) {
            var Bale = {},
                errField = null,
                sqlQuery = null,
                errCode = null;

            if (hasSizeGroupCode) {
                sqlQuery = "SELECT SizeGroupId FROM SizeGroup WHERE SizeGroupCode= :SizeGroupCode";
                Bale.SizeGroupCode = sku.SizeGroupCode;
                errField = 'SizeGroupCode';
                yield runDBCheck(tr, sku, sqlQuery, 'MSG_ERR_FIELD_NOT_FOUND', errField, 'SizeGroupId', Bale, errorCols);
            }

            if (hasSizeId) {
                sqlQuery = 'SELECT SizeId FROM Size s WHERE SizeId=:SizeId';
                Bale.SizeId = sku.SizeId;
                errField = 'SizeId';
                errCode = 'MSG_ERR_INVALID_FIELD';

            }
            else if (hasSizeCode && hasSizeGroupCode) {
                sqlQuery = "SELECT s.`SizeId` FROM `Size` s INNER JOIN `SizeGroup` sg ON s.`SizeGroupId` = sg.`SizeGroupId` AND sg.`SizeGroupCode`= :SizeGroupCode WHERE s.`SizeCode` = :SizeCode ";
                Bale.SizeCode = sku.SizeCode;
                Bale.SizeGroupCode = sku.SizeGroupCode;
                errField = 'SizeCode';
                errCode = 'MSG_ERR_FIELD_NOT_FOUND';
            }

            yield runDBCheck(tr, sku, sqlQuery, 'MSG_ERR_FIELD_NOT_FOUND', errField, 'SizeId', Bale, errorCols);

            if (hasSizeId && (sku.StatusId !== CONSTANTS.STATUS.DELETED)) {
                validateNumber(sku, 'SizeId', false, 1, 9999999999, errorCols); 
            }
        }
        else {
            let errorField = '';
            if (!hasSizeGroupCode)
                errorField = "SizeGroupCode";
            else if (!hasSizeCode)
                errorField = "SizeCode";
            else {
                errorField = "SizeId";
            }
            setErr(sku, 'MSG_ERR_REQUIRED_FIELD_MISSING', errorField, errorField, errorCols);
        }
    });

    this.dbCheckAndSetStatus = Q.async(function*(tr, sku, errorCols) {
        sku.isNew = true;
        var sqlQuery = "SELECT SkuId, StatusId FROM Sku WHERE StyleCode = :StyleCode AND SkuCode = :SkuCode AND MerchantId = :MerchantId AND StatusId <> 1";

        var data = yield tr.queryOne(sqlQuery, {
            StyleCode: sku.StyleCode,
            SkuCode: sku.SkuCode,
            MerchantId: sku.MerchantId
        });

        if (data && !cu.isUndefined(data.SkuId) && !cu.isUndefined(data.StatusId)) {
            sku.SkuId = data.SkuId;
            sku.StatusId = data.StatusId;
            sku.isNew = false;
        }

        if (cu.isTrue(sku.IsImport)) {
            if (!cu.isBlank(sku.SKUStatus)) {

                var statusName = sku.SKUStatus.toString().toUpperCase();
                var statusId = CONSTANTS.STATUS[statusName],
                    isStatusIdValid = !cu.isBlank(statusId);

                sku.StatusId = statusId;

                if (isStatusIdValid && sku.isNew && CONSTANTS.STATUS.PENDING !== statusId) {
                    isStatusIdValid = false;
                }

                //1:Deleted, 2: Active, 3: Pending, 4:Inactive
                var validStatus = {
                    2: [CONSTANTS.STATUS.ACTIVE, CONSTANTS.STATUS.INACTIVE, CONSTANTS.STATUS.PENDING],
                    3: [CONSTANTS.STATUS.PENDING, CONSTANTS.STATUS.ACTIVE, CONSTANTS.STATUS.INACTIVE],
                    4: [CONSTANTS.STATUS.INACTIVE, CONSTANTS.STATUS.ACTIVE, CONSTANTS.STATUS.PENDING]
                };

                if (cu.isInteger(statusId) && isStatusIdValid && data) {
                    isStatusIdValid = validStatus[data.StatusId].indexOf(statusId) > -1;
                }
                if (!isStatusIdValid) {
                    setErr(sku, 'MSG_ERR_INVALID_FIELD', 'SKUStatus', 'SKUStatus', errorCols);
                }
                else {
                    // Set Delete flag for product import Delete operation
                    if (CONSTANTS.STATUS.DELETED === statusId) {
                        sku.Delete = true;
                    }
                }
            } else {
                if (sku.isNew) {
                    sku.StatusId = CONSTANTS.STATUS.PENDING;
                }
                sku.SKUStatus = Factory.getSkuStatus(sku.StatusId);
                // setErr(sku, 'MSG_ERR_REQUIRED_FIELD_MISSING', 'SKUStatus', 'SKUStatus', errorCols);
            }
        } else {
            if (sku.isNew) {
                sku.StatusId = CONSTANTS.STATUS.PENDING;
            }
        }
    });

    this.dbCheckBarcodeUniqueWithinMerchant = Q.async(function*(tr, sku, errorCols) {
        if (!cu.isBlank(sku.Barcode)) {
            var sqlQuery = "SELECT COUNT(SkuId) COUNT FROM Sku WHERE Barcode=:Barcode AND MerchantId=:MerchantId AND StatusId <> 1";
            if (!cu.isBlank(sku.SkuId)) {
                sqlQuery += " AND SkuId!=:SkuId";
            }

            let data = yield tr.queryOne(sqlQuery, {
                Barcode: sku.Barcode,
                MerchantId: sku.MerchantId,
                SkuId: sku.SkuId
            });
            if (data.COUNT) {
                if (errorCols) {
                    setErr(sku, 'MSG_ERR_INVALID_FIELD', 'Barcode', 'Barcode', errorCols);
                }
                return false;
            }
            return true;
        }
    });

    this.dbCheckSkuCodeUniqueWithinMerchant = Q.async(function*(tr, sku, errorCols){
        var sqlQuery = "SELECT COUNT(SkuId) COUNT FROM Sku WHERE SkuCode=:SkuCode AND MerchantId=:MerchantId AND StatusId <> 1";
        if (!cu.isBlank(sku.SkuId)) {
            sqlQuery += " AND SkuId!=:SkuId";
        }

        let data = yield  tr.queryOne(sqlQuery, {
            SkuCode: sku.SkuCode,
            MerchantId: sku.MerchantId,
            SkuId: sku.SkuId
        });

        if(data.COUNT){
            if(errorCols){
                setErr(sku, 'MSG_ERR_INVALID_FIELD', 'SkuCode', 'SkuCode', errorCols);
            }
            return false;
        }
        return true;
    });

    var setSkuDefaultVal = function (sku) {
        var fieldNames = ['SkuName', 'Description', 'SizeComment', 'Feature', 'Material', 'ColorName'];
        var srcLanguage = 'CHS';
        var invariantLanguage = 'EN';
        var otherLanguages = ['CHT', 'EN'];

        for (var fieldName of fieldNames) {
            for (var otherLanguage of otherLanguages) {
                if (!cu.isBlank(sku[fieldName + "-" + srcLanguage]) &&
                    cu.isBlank(sku[fieldName + "-" + otherLanguage])) {
                    sku[fieldName + "-" + otherLanguage] = sku[fieldName + "-" + srcLanguage];
                }
            }
            sku[fieldName + 'Invariant'] = sku[fieldName + "-" + invariantLanguage];
        }

        _.each(otherLanguages, function (language) {
            _.each(fieldNames, function (fieldName) {
                if (!cu.isBlank(sku[fieldName + "-CHS"]) &&
                    cu.isBlank(sku[fieldName + "-" + language])) {
                    sku[fieldName + "-" + language] = sku[fieldName + "-CHS"];
                }
            });
        });

        var setDefaultNullFields = ['SalePriceFrom', 'SalePriceTo', 'AvailableFrom', 'AvailableTo'];
        for (var setDefaultNullField of setDefaultNullFields) {
            if (cu.isBlank(sku[setDefaultNullField])) {
                sku[setDefaultNullField] = null;
            }
        }

        // var setDefaultZeroFields = ["BrandId", "BadgeId", "SeasonId", "SizeId", "ColorId", "GeoCountryId", "MerchantId", "QtySafetyThreshold", "DisplayRanking", "PriceSale", "IsDefault"];
        var setDefaultZeroFields = ["QtySafetyThreshold", "DisplayRanking", "IsDefault"];
        for (var setDefaultZeroField of setDefaultZeroFields) {
            if (cu.isBlank(sku[setDefaultZeroField])) {
                sku[setDefaultZeroField] = 0;
            }
        }
    };

    this.validateImagesForSkuImport = Q.async(function *(tr, sku, errorCols) {
        if (cu.isTrue(sku.Overwrite) && cu.isTrue(sku.IsImport) && sku.StatusId === CONSTANTS.STATUS.ACTIVE) {

            //Validate Color Image
            let colorImageSql = `
                SELECT 
                    Count(*) Total 
                FROM StyleImage SI 
                INNER JOIN Sku S ON 
                    S.StyleCode = SI.StyleCode AND 
                    S.MerchantId = SI.MerchantId AND
                    S.ColorKey = SI.ColorKey
                WHERE
                    S.StyleCode =:StyleCode
                    AND S.MerchantId = :MerchantId
                    AND S.IsDefault = 1
                    AND SI.ImageTypeId = ${CONSTANTS.PRODUCT_IMG_TYPE.COLOR}
            `;
            let totalColorImages = (yield tr.queryOne(colorImageSql, {
                StyleCode: String(sku.StyleCode),
                MerchantId: parseInt(sku.MerchantId)
            })).Total;

            if (totalColorImages === 0) {
                setErr(sku, 'MSG_ERR_PRODUCT_DEFAULT_COLOR_IMAGES_REQUIRED', "StatusId", "Default sku color image is required.", errorCols);
            }
        }
    });

    this.checkUniqueFieldsInSameImport = function(sku, duplicatedSkuMap, errorCols) {
        if(!duplicatedSkuMap) return;

        for(var uniqueField in duplicatedSkuMap){
            var exist = _.find(duplicatedSkuMap[uniqueField], function(value){
                return value === sku[uniqueField];
            });

            if(exist) {
                setErr(sku, 'MSG_ERR_INVALID_FIELD', uniqueField, uniqueField, errorCols);
            }
        }
    };

    this.setAndValidateSku = Q.async(function*(tr, sku, duplicatedSkuMap) {
        var errorCols = sku.IsImport ? [] : null;

        setSkuDefaultVal(sku);

        this.validateBasicFormat(sku, errorCols);
        this.checkUniqueFieldsInSameImport(sku, duplicatedSkuMap, errorCols);

        yield this.dbCheckAndSetStatus(tr, sku, errorCols);
        yield this.dbCheckAndSetBrandAndMerchant(tr, sku, errorCols);
        yield this.dbCheckAndSetBadge(tr, sku, errorCols);
        yield this.dbCheckAndSetSeason(tr, sku, errorCols);
        yield this.dbCheckAndSetSize(tr, sku, errorCols);
        yield this.dbCheckAndSetColor(tr, sku, errorCols);
        yield this.dbCheckColorNameBySizeCode(tr, sku, errorCols);        
        yield this.dbCheckAndSetGeoCountry(tr, sku, errorCols);
        yield this.dbCheckAndSetCategories(tr, sku, errorCols);
        yield this.dbCheckIsDefault(tr, sku, errorCols);
        yield this.dbCheckBarcodeUniqueWithinMerchant(tr, sku, errorCols);
        yield this.dbCheckSkuCodeUniqueWithinMerchant(tr, sku, errorCols);

        if (cu.isTrue(sku.Overwrite) && cu.isTrue(sku.Delete)) {
            yield this.validateDeleteSku(tr, sku, errorCols);
        }

        if (cu.isTrue(sku.IsImport)) {
            yield this.validateImagesForSkuImport(tr, sku, errorCols);
        }

        return errorCols;
    });
};

var skuListQueryBuilder = new SkuListQuery();
var skuValidator = new SkuValidator();
var skuManager = new SkuManager();



Factory.skuValidator = skuValidator;
Factory.skuManager = skuManager;

Factory.moveToWishList = Q.async(function *(tr, CultureCode, CartKey, UserKey, CartItemId, WishlistKey) {
    var ret = yield Factory.wishlistLogic(tr, CultureCode, CartKey, UserKey, CartItemId, WishlistKey);
    var item = yield tr.queryExecute('update CartItem set StatusId=1 where CartId=:CartId and CartItemId=:CartItemId and StatusId=:StatusId', {
        CartId: ret.cart.CartId,
        StatusId: 2,
        CartItemId: CartItemId
    });
    var cart = yield Factory.viewBisByCartKey(tr, CultureCode, ret.cart.CartKey);
    cart.WishlistKey = ret.WishlistKey;
    return cart;
});

/*

 Replace below special character

 < (less than)
 > (greater than)
 : (colon)
 " (double quote)
 / (forward slash)
 \ (backslash)
 | (vertical bar or pipe)
 ? (question mark)
 * (asterisk)

 */
Factory.compactFilename = function (str) {
    str = str.replace(/ /g, "");
    str = str.replace(/([?<>:*|"\[\]\/\\])/g, "");
    str = str.replace(/<|>/g, "");
    return str;
};

Factory.SkuHeader = [
    {field: "StyleCode", name: "Style Code"},
    {field: "SkuCode", name: "Sku Code"},
    {field: "Barcode", name: "Barcode"},
    {field: "BrandCode", name: "Brand Code"},
    {field: "BadgeCode", name: "Badge Code"},
    {field: "CountryOriginCode", name: "Country Origin Code"},
    {field: "LaunchYear", name: "Launch Year"},
    {field: "SeasonCode", name: "Season Code"},
    {field: "RetailPrice", name: "Retail Price"},
    {field: "PriceSale", name: "Price Sale"},
    {field: "SalePriceFrom", name: "Sale Price From"},
    {field: "SalePriceTo", name: "Sale Price To"},
    {field: "AvailableFrom", name: "Available From"},
    {field: "AvailableTo", name: "Available To"},
    {field: "QtySafetyThreshold", name: "Qty Safety Threshold"},
    {field: "PrimaryCategoryCode", name: "Primary Category Code"},
    {field: "MerchandisingCategoryCode1", name: "Merchandising Category Code 1"},
    {field: "MerchandisingCategoryCode2", name: "Merchandising Category Code 2"},
    {field: "MerchandisingCategoryCode3", name: "Merchandising Category Code 3"},
    {field: "MerchandisingCategoryCode4", name: "Merchandising Category Code 4"},
    {field: "MerchandisingCategoryCode5", name: "Merchandising Category Code 5"},
    {field: "SizeGroupCode", name: "Size Group Code"},
    {field: "SizeCode", name: "Size Code"},
    {field: "ColorCode", name: "Color Code"},
    {field: "ColorName-CHS", name: "Color Name - CHS"},
    {field: "ColorName-CHT", name: "Color Name - CHT"},
    {field: "ColorName-EN", name: "Color Name - EN"},
    {field: "SkuName-CHS", name: "Sku Name - CHS"},
    {field: "SkuName-CHT", name: "Sku Name - CHT"},
    {field: "SkuName-EN", name: "Sku Name - EN"},
    {field: "Description-CHS", name: "Description - CHS"},
    {field: "Description-CHT", name: "Description - CHT"},
    {field: "Description-EN", name: "Description - EN"},
    {field: "SizeComment-CHS", name: "Size Comment - CHS"},
    {field: "SizeComment-CHT", name: "Size Comment - CHT"},
    {field: "SizeComment-EN", name: "Size Comment - EN"},
    {field: "DisplayRanking", name: "Display Ranking"},
    {field: "IsDefault", name: "Is Default"},
    {field: "SKUStatus", name: "SKU Status"}
];

// Factory.isValidDate = function (date) {
//     return moment(date, CONSTANTS.DATE_FORMAT, true).isValid();
// };

Factory.isBlank = function (string) {
    if (string === null || string === undefined || string === '') {
        return true;
    } else {
        if (string.toString().indexOf(':MISSING:') > -1 || string.toString().indexOf(':NOTVALID:') > -1 || string.toString().indexOf(':NOTFOUND:') > -1) {
            return true;
        } else {
            return false;
        }
    }
};

/**
 * Get SKU status id from status
 *
 * @param  {string}    status      SKU status
 *
 * @return {number}    statusId    SKU status id
 *
 */
// Factory.getSkuStatusId = function (status) {
//     switch (status) {
//         case "Delete":
//             return CONSTANTS.STATUS.DELETED;
//         case "Active":
//             return CONSTANTS.STATUS.ACTIVE;
//         case "Pending":
//             return CONSTANTS.STATUS.PENDING;
//         case "Inactive":
//             return CONSTANTS.STATUS.INACTIVE;
//         default:
//             return -1;
//     }
// };

/**
 * Get SKU status from status id
 *
 * @param  {number}    statusId      SKU status id
 *
 * @return {string}    status        SKU status
 *
 */
Factory.getSkuStatus = function (statusId) {
    switch (statusId) {
        case CONSTANTS.STATUS.DELETED:
            return "Deleted";
        case CONSTANTS.STATUS.ACTIVE:
            return "Active";
        case CONSTANTS.STATUS.PENDING:
            return "Pending";
        case CONSTANTS.STATUS.INACTIVE:
            return "Inactive";
    }
};

/**
 * @returns {*|promise}
 */
Factory.existsSku = function (tr, skuId, merchantId) {
    var deferred = Q.defer();

    Q.when()
        .then(function () {
            return tr.queryOne("SELECT `SkuId` FROM `Sku` WHERE SkuId = :SkuId AND MerchantId = :MerchantId", {
                SkuId: skuId,
                MerchantId: merchantId
            });
        })
        .then(function (data) {
            if (data == null) {
                throw new Error("no sku id found for this merchant id " + merchantId);
            } else {
                deferred.resolve(true);
            }
        })
        .catch(function (err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

//do not change this method without talking to Albert.
Factory.styleList = function (tr, MerchantId, CategoryId, StyleCode, StatusId, Search, CultureCode, page, size, MissingImgType, SkuId, SkuCode, LastChangedFrom,LastChangedTo) {
    var deferred = Q.defer();
    var CategoryListAdjacency = null;
    var ProductList = null;
    var ProductSize = 0;
    var ProductTotalSize = 0;
    var PageCount = 0;

    StyleCode = cu.convertString(StyleCode);
    SkuCode = cu.convertString(SkuCode);

    if (page) {
        page = parseInt(page);
    }
    if (isNaN(page)) {
        page = 1;
    }

    //decrease page number for offset
    page -= 1;

    var limit = parseInt(size);
    var offset = (page * limit);

    var CategoryArray = null;

    //var fields="s.StyleCode, s.MerchantId, '00000000000000000000000000000000' as ImageDefault, style.PriceRetail, style.PriceSale, style.SaleFrom, style.SaleTo, style.LastModified, style.LastCreated, s.AvailableFrom, s.AvailableTo, ManufacturerName, LaunchYear, b.BrandId, bc.BrandName, b.BrandNameInvariant, b.HeaderLogoImage as BrandHeaderLogoImage, b.SmallLogoImage as BrandSmallLogoImage, scu.SkuName, s.SkuNameInvariant, scu.SkuDesc, s.SkuDescInvariant, scu.SkuFeature, s.SkuFeatureInvariant, scu.SkuSizeComment, s.SkuSizeCommentInvariant, s.StatusId, stc.StatusName, st.StatusNameInvariant, s.SeasonId, seac.SeasonName, sea.SeasonNameInvariant, bad.BadgeId, badc.BadgeName, bad.BadgeNameInvariant, s.GeoCountryId, gcoc.GeoCountryName, gco.GeoCountryNameInvariant, s.SkuId as PrimarySkuId, s.IsDefault";  // max(LastCreated)>=DATE_SUB(NOW(), INTERVAL 1 MONTH) as IsNew, (now() BETWEEN min(SaleFrom) and max(SaleTo)) as IsSale"; //scat.CategoryId as PrimaryCategoryId,
    //var sql="select {fields} from (select StyleCode,MerchantId, SkuId, PriceRetail, PriceSale, SaleFrom, SaleTo, LastModified, LastCreated from Sku where StatusID<>1 and IsDefault=1) style inner join Sku s on (style.SkuId=s.SkuId and style.MerchantId=s.MerchantId) inner join SkuCulture scu on (s.SkuId=scu.SkuId and scu.CultureCode=:CultureCode) inner join Brand b on (s.BrandId=b.BrandId) inner join BrandCulture bc on (b.BrandId=bc.BrandId and bc.CultureCode=:CultureCode) inner join Status st on (s.StatusId=st.StatusId) inner join StatusCulture stc on (st.StatusId=stc.StatusId and stc.CultureCode=:CultureCode) inner join Season sea on (s.SeasonId=sea.SeasonId) inner join SeasonCulture seac on (sea.SeasonId=seac.SeasonId and seac.CultureCode=:CultureCode) inner join Badge bad on (s.BadgeId=bad.BadgeId) inner join BadgeCulture badc on (bad.BadgeId=badc.BadgeId and badc.CultureCode=:CultureCode) inner join GeoCountry gco on (s.GeoCountryId=gco.GeoCountryId) inner join GeoCountryCulture gcoc on (gco.GeoCountryId=gcoc.GeoCountryId and gcoc.CultureCode=:CultureCode) where 1=1 {where}  "; // inner join SkuCategory scat on (s.SkuId=scat.SkuId and scat.Priority=0)
    var fields = "s.StyleCode, s.StyleId, s.MerchantId, m.StatusId as MerchantStatusId, m.MerchantNameInvariant, mc.MerchantName, m.IsCrossBorder, '00000000000000000000000000000000' as ImageDefault, s.PriceRetail, s.PriceSale, s.SaleFrom, s.SaleTo, s.LastModified, s.LastCreated, s.AvailableFrom, s.AvailableTo, LaunchYear, b.BrandId, b.StatusId as BrandStatusId, bc.BrandName, b.BrandNameInvariant, b.HeaderLogoImage as BrandHeaderLogoImage, b.SmallLogoImage as BrandSmallLogoImage, b.IsRed as BrandIsRed, b.IsBlack as BrandIsBlack, scu.SkuName, s.SkuNameInvariant, scu.SkuDesc, s.SkuDescInvariant,  scu.SkuSizeComment, s.SkuSizeCommentInvariant, s.StatusId, stc.StatusName, st.StatusNameInvariant, s.SeasonId, seac.SeasonName, sea.SeasonNameInvariant, bad.BadgeId, badc.BadgeName, bad.BadgeNameInvariant, bad.BadgeImage, bad.BadgeCode, s.GeoCountryId, gcoc.GeoCountryName, gco.GeoCountryNameInvariant, s.SkuId as PrimarySkuId, s.DisplayRanking, s.IsDefault";  // max(LastCreated)>=DATE_SUB(NOW(), INTERVAL 1 MONTH) as IsNew, (now() BETWEEN min(SaleFrom) and max(SaleTo)) as IsSale"; //scat.CategoryId as PrimaryCategoryId,
    var sql = "select {fields} from (select SkuId from Sku s where s.IsDefault=1 and s.BrandId not in (0) {where} {limit}) sk inner join Sku s on (sk.SkuId=s.skuId) inner join Merchant m on (s.MerchantId=m.MerchantId) inner join MerchantCulture mc on(s.MerchantId=mc.MerchantId and mc.CultureCode=:CultureCode) inner join SkuCulture scu on (s.SkuId=scu.SkuId and scu.CultureCode=:CultureCode) inner join Season sea on (s.SeasonId=sea.SeasonId) inner join SeasonCulture seac on (sea.SeasonId=seac.SeasonId and seac.CultureCode=:CultureCode) inner join Brand b on (s.BrandId=b.BrandId) inner join BrandCulture bc on (b.BrandId=bc.BrandId and bc.CultureCode=:CultureCode) inner join Status st on (s.StatusId=st.StatusId) inner join StatusCulture stc on (st.StatusId=stc.StatusId and stc.CultureCode=:CultureCode) inner join Badge bad on (s.BadgeId=bad.BadgeId) inner join BadgeCulture badc on (bad.BadgeId=badc.BadgeId and badc.CultureCode=:CultureCode) inner join GeoCountry gco on (s.GeoCountryId=gco.GeoCountryId) inner join GeoCountryCulture gcoc on (gco.GeoCountryId=gcoc.GeoCountryId and gcoc.CultureCode=:CultureCode)"; // inner join SkuCategory scat on (s.SkuId=scat.SkuId and scat.Priority=0)
    var sqlCount = "select {fields} from Sku s where s.IsDefault=1 and s.BrandId not in (0) {where} {limit}"; // inner join SkuCategory scat on (s.SkuId=scat.SkuId and scat.Priority=0)

    var where = '';
    var sq = '';
    var params = {};

    Q.when()
        .then(function () {
            if (cu.isBlank(CultureCode)) {
                throw {AppCode: 'MSG_ERR_REQUIRED_FIELD_MISSING'};
            }
        })
        .then(function () {
            return lcat.listAdjacency(tr, CultureCode, true).then(function (data) {
                CategoryListAdjacency = data;
            });
        })
        .then(function () {
            if (!cu.checkIdBlank(MerchantId)) {
                MerchantId=parseInt(MerchantId);
                where = where + " and s.MerchantId=:MerchantId ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(SkuId)) {
                SkuId=parseInt(SkuId);
                where = where + " and s.SkuId=:SkuId ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(SkuCode)) {
                where = where + " and s.SkuCode=:SkuCode ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(StatusId)) {
                StatusId=parseInt(StatusId);
                where = where + " and s.StatusId=:StatusId ";
            }
            else {
                where = where + " and s.StatusId in (2,3,4) "
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(Search)) {
                Search = Search + '%';
                //where = where + " and (scu.SkuName like :Search or bc.BrandName like :Search or s.StyleCode like :Search) ";
                 where = where + " and (s.SkuNameInvariant like :Search or s.StyleCode like :Search or s.BrandId in (select b.BrandId from Brand b inner Join BrandCulture bc on (b.BrandId=bc.BrandId and bc.CultureCode=:CultureCode) where bc.BrandName like :Search)) ";
            }
        })
        .then(function () {
            if (!cu.isBlank(LastChangedFrom)) {
                
                if(cu.isBlank(LastChangedTo))
                    LastChangedTo='2100-01-01';

                let merchantWhere='';                
                if (!cu.checkIdBlank(MerchantId))
                    merchantWhere= ' and s.MerchantId=:MerchantId';


                where = ` and s.StyleId in 
                (
                    select a.StyleId from (
                        select s.StyleId from Sku s inner join Brand b on s.BrandId=b.BrandId where s.IsDefault=1 and b.LastModified between :LastChangedFrom and :LastChangedTo ${merchantWhere}
                        union
                        select s.StyleId from Sku s inner join Merchant m on s.MerchantId=m.MerchantId where s.IsDefault=1 and m.LastModified  between :LastChangedFrom and :LastChangedTo ${merchantWhere}
                        union
                        select distinct StyleId from Sku where LastModified between :LastChangedFrom and :LastChangedTo ${merchantWhere}
                        union
                        select distinct s.StyleId from StyleImage si inner join Sku s on si.StyleCode=s.StyleCode and si.MerchantId=s.MerchantID and s.IsDefault=1 where si.LastModified between :LastChangedFrom and :LastChangedTo ${merchantWhere}
                        union
                        select distinct s.StyleId from SkuCategory sc inner join Sku s on sc.SkuId=s.SkuId where sc.LastModified  between :LastChangedFrom and :LastChangedTo  ${merchantWhere}
                        union
                        select distinct s.StyleID from Inventory i inner join Sku s on i.SkuId=s.SkuId where i.LastModified  between :LastChangedFrom and :LastChangedTo  ${merchantWhere}
                    ) a
                )`;
            }
        })


        
        /*
        .then(function () {
            if (!cu.isBlank(MissingImgType)) {
                var desc = '';
                var s = _.parseInt(MissingImgType);
                switch (s) {
                    case CONSTANTS.PRODUCT_IMG_TYPE.FEATURE:
                    case CONSTANTS.PRODUCT_IMG_TYPE.DESC:
                        desc = s === 1 ? 'Feature' : 'Desc';
                        where = where + " and exists (select StyleCode from " +
                            "(select ss.StyleCode " +
                            "	from Sku ss " +
                            "	left join (select StyleCode, SUM(IF(ImageTypeCode = \'" + desc + "\', 1, 0)) AS Total " +
                            "			from StyleImage where MerchantId = :MerchantId and ImageTypeCode = \'" + desc + "\' group by StyleCode) si on ss.StyleCode = si.StyleCode  " +
                            "	where si.Total is null OR si.Total = 0) a where s.StyleCode = a.StyleCode) ";
                        break;
                    case CONSTANTS.PRODUCT_IMG_TYPE.COLOR:
                        where = where + " and exists (select StyleCode from " +
                            "( SELECT ss.StyleCode, Count(si.ColorKey) as ImageCount " +
                            "	FROM Sku ss " +
                            "	LEFT JOIN StyleImage si " +
                            "   ON si.MerchantId = :MerchantId AND ImageTypeCode= \'Color\' " +
                            "   AND si.StyleCode = ss.StyleCode	AND ss.ColorKey = si.ColorKey " +
                            "   GROUP BY ss.StyleCode HAVING ImageCount = 0 ) a " +
                            "	WHERE  s.StyleCode = a.StyleCode ) "
                        break;
                }
            }
        })
        */
        .then(function () {
            if (!cu.isBlank(StyleCode)) {
                where = where + " and s.StyleCode=:StyleCode ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(CategoryId)) {
                CategoryId=parseInt(CategoryId);
                var tree = lcat.convertTree(CategoryListAdjacency);
                var subtree = lcat.findSubtree(tree, CategoryId);
                var catarray = lcat.subtreeCategoryArray(subtree);
                var cin = catarray.join();
                cin = cin.replace(/[;\']/g, '###'); //don't allow literal quote, or semi colons put triple hash in to show the error
                //where=where + " and scat.CategoryId in ({cin})";
                where = where + " and s.SkuId in (select SkuId from SkuCategory where CategoryId in ({cin}))";
                where = where.replace('{cin}', cin);
            }
        })
        .then(function () {
            sq = sql;
            sq = sq.replace('{fields}', fields);
            sq = sq.replace('{where}', where);
            sq = sq.replace('{limit}', " order by s.LastCreated ASC  LIMIT " + offset + "," + limit);
            //sq = sq + " LIMIT " + offset + "," + limit;
            return tr.queryMany(sq, {
                MerchantId: MerchantId,
                CultureCode: CultureCode,
                StatusId: StatusId,
                StyleCode: StyleCode,
                Search: Search,
                SkuId: SkuId,
                SkuCode: SkuCode,
                LastChangedFrom: LastChangedFrom,
                LastChangedTo: LastChangedTo
            }).then(function (data) {
                ProductList = data;
            })
        })
        .then(function () {
            if (page == 0 && ProductList.length < size) {
                //if teh user requested the first page and the result are already less that teh pagesize then there is no need to calculate the overal count again
                ProductTotalSize = ProductList.length;
                PageCount = 1;

            }
            else {
                sq = sqlCount;
                sq = sq.replace('{fields}', ' COUNT(*) as Total ');
                sq = sq.replace('{where}', where);
                sq = sq.replace('{limit}', '');
               return tr.queryOne(sq, {
                    MerchantId: MerchantId,
                    CultureCode: CultureCode,
                    StatusId: StatusId,
                    StyleCode: StyleCode,
                    Search: Search,
                    SkuId: SkuId,
                    SkuCode: SkuCode,
                    LastChangedFrom: LastChangedFrom,
                    LastChangedTo: LastChangedTo
                }).then(function (data) {
                    ProductTotalSize = data.Total;
                    var PageCountDec = (ProductTotalSize / size);
                    PageCount = parseInt(PageCountDec);
                    if (PageCountDec > PageCount)
                        PageCount = PageCount + 1;
                });
            }
        })
        .then(function () {
            return li.setParamStatus(params, tr);
        })
        .then(function () {
            var promises = ProductList.map(throat(10,function (iProd) {
                var catgeorySql = "select sc.CategoryId, sc.Priority from SkuCategory sc where sc.SkuId=:SkuId and sc.CategoryId<>0;";
                var imageSql = "select StyleImageId, ProductImage, ImageTypeCode, ColorKey, Position from StyleImage where MerchantId = :MerchantId and StyleCode = :StyleCode order by ColorKey, Position";
                var skuSql = skuListQueryBuilder.getDataQuery("s.MerchantId = :MerchantId AND s.StyleCode=:StyleCode AND s.StatusId IN (2,3,4) ");

                var systemSafetyThreshold = config.inventory.systemSafetyThreshold;
                var productLowStockThreshold = config.inventory.productLowStockThreshold;
                var perpetualAllocationNo = config.inventory.perpetualAllocationNo;
                return tr.queryMany(skuSql + catgeorySql + imageSql,
                    {
                        StyleCode: iProd.StyleCode,
                        SkuId: iProd.PrimarySkuId,
                        MerchantId: iProd.MerchantId,
                        CultureCode: CultureCode,
                        PerpetualAllocationNo: perpetualAllocationNo
                    }).then(function (data) {
                    let defaultSku;
                    let rd = moment();
                    iProd.StyleKey = iProd.MerchantId + '-' + iProd.StyleCode;
                    iProd.IsNew = ~~(moment(iProd.LastCreated) >= rd.add(-1, 'months'));
                    iProd.IsSale = Factory.checkIsSale(iProd);
                    iProd.PriceSort = cu.isTrue(iProd.IsSale) ? iProd.PriceSale : iProd.PriceRetail;
                    iProd.TotalLocationCount = 0;
                    iProd.QtyAts = 0;
                    iProd.ColorList = [];
                    iProd.SizeList = [];
                    iProd.SkuList = data[0];

                    for (let iSku of iProd.SkuList) {
                        //calculate the total location count of all skus within one style.
                        if (!isNaN(iSku.LocationCount)) {
                            iProd.TotalLocationCount += iSku.LocationCount;
                        }
                        if (iSku.IsDefault) {
                            defaultSku = iSku;
                        }

                        //Update inventory status
                        iSku.InventoryStatusId = params.NAId;

                        //check if QtyATS is valid before calculating INvStatusId which depends on it
                        if (cu.isBlank(iSku.QtyAts))
                            iSku.QtyAts = 0;
                        else
                            iSku.QtyAts = parseInt(iSku.QtyAts);

                        //now calcualte the InventoryStatusId which is how avialbel teh sku is
                        if (iSku.LocationCount) {
                            if (iSku.QtyAts === perpetualAllocationNo) {
                                iSku.InventoryStatusId = params.InStockId;
                            } else if (iSku.QtyAts < systemSafetyThreshold * iSku.LocationCount) {
                                iSku.InventoryStatusId = params.OutOfStockId;
                            } else if (iSku.QtyAts <= productLowStockThreshold * iSku.LocationCount) {
                                iSku.InventoryStatusId = params.LowStockId;
                            } else {
                                iSku.InventoryStatusId = params.InStockId;
                            }
                        } else {
                            //not have any active inventory location
                            iSku.QtyAts = 0;
                        }

                        iProd.QtyAts = iProd.QtyAts + Math.max(iSku.QtyAts, 0);

                        iSku.IsNew = ~~(moment(iSku.LastCreated) >= rd.add(-1, 'months'));
                        iSku.IsSale = Factory.checkIsSale(iSku);
                        iSku.PriceSort = cu.isTrue(iSku.IsSale) ? iSku.PriceSale : iSku.PriceRetail;

                        //derive the distinct size and color lists form the sku list
                        let found = null;
                        if (iSku.ColorId != 0) {
                            let Color = {
                                ColorId: iSku.ColorId,
                                ColorName: iSku.ColorName,
                                ColorKey: iSku.ColorKey,
                                ColorCode: iSku.ColorCode,
                                ColorImage: iSku.ColorImage,
                                SkuColor: iSku.SkuColor
                            };
                            found = false;
                            for (let C of iProd.ColorList)
                                if (cu.objectEqualByValues(Color, C))
                                    found = true;
                            if (!found) {
                                iProd.ColorList.push(Color);
                            }
                        }
                        if (iSku.SizeId != 0) {
                            let Size = {
                                SizeId: iSku.SizeId,
                                SizeName: iSku.SizeName,
                                SizeGroupId: iSku.SizeGroupId,
                                SizeGroupCode: iSku.SizeGroupCode,
                                SizeGroupName: iSku.SizeGroupName
                            };
                            found = false;
                            for (let S of iProd.SizeList)
                                if (cu.objectEqualByValues(Size, S))
                                    found = true;
                            if (!found) {
                                iProd.SizeList.push(Size);
                            }
                        }
                    }

                    //now sort sizes
                    if (iProd.SizeList.length > 0)
                        iProd.SizeList = _.sortBy(iProd.SizeList, 'SizeId');

                    //start category
                    iProd.CategoryPriorityList = [];
                    var skuCategoryList = _.sortBy(data[1], 'Priority');
                    for (let iCat of skuCategoryList) {
                        let cattle = lcat.categoryPath(CategoryListAdjacency, iCat.CategoryId);
                        for (let iPror of cattle) {
                            if (!_.find(iProd.CategoryPriorityList, { CategoryId: iPror.CategoryId })) {
                                iPror.Priority = iCat.Priority;
                                iProd.CategoryPriorityList.push(iPror);
                            }
                        }
                    }
                    //end category

                    //start image
                    iProd.DescriptionImageList = [];
                    iProd.ColorImageList = [];
                    for (let row of data[2]) {
                        if (row.ImageTypeCode === 'Desc') {
                            iProd.DescriptionImageList.push({
                                StyleImageId: row.StyleImageId,
                                ImageKey: row.ProductImage,
                                Position: row.Position
                            });
                        } else if (row.ImageTypeCode === 'Color') {
                            iProd.ColorImageList.push({
                                StyleImageId: row.StyleImageId,
                                ColorKey: row.ColorKey,
                                ImageKey: row.ProductImage,
                                Position: row.Position
                            });
                        }
                    }

                    if (iProd.ColorImageList.length > 0) {
                        let defaultColorImage;
                        // get color key of default sku. 
                        let defaultSkuColorKey = defaultSku ? defaultSku.ColorKey : '';
                        if (defaultSkuColorKey) {
                            // Set the first color image of default sku (which has the lowest position) as default. The "order by" in SQL is important.
                            defaultColorImage = _.find(iProd.ColorImageList, 'ColorKey', defaultSkuColorKey);
                        }
                        // in case Default Sku has no image, set the first color image as default.
                        iProd.ImageDefault = defaultColorImage ? defaultColorImage.ImageKey : iProd.ColorImageList[0].ImageKey;
                    }
                    else if (iProd.DescriptionImageList.length > 0) {// Use the first description image as default if there is no color image.
                        iProd.ImageDefault = iProd.DescriptionImageList[0].ImageKey;
                    }
                    //end image
                });
            }));//end func throat map
            return Q.all(promises);
        })
        .then(function () {
            deferred.resolve({
                HitsTotal: ProductTotalSize,
                PageTotal: parseInt(PageCount),
                PageSize: parseInt(size),
                PageCurrent: page + 1,
                PageData: ProductList
            });
        })
        .catch(function (err) {
            deferred.reject(err);
        })
        .done();

    return deferred.promise;
};

Factory.skuList = function (tr, MerchantId, BrandId, StyleCode, CategoryId, StatusId, SkuId, SkuCode, Search, CultureCode, page, size, afterSkuId) {
    var deferred = Q.defer();
    var CategoryListAdjacency = null;
    var ProductList = null;
    var ProductSize = 0;
    var ProductTotalSize = 0;
    var PageCount = 0;

    if (page) {
        page = parseInt(page);
    }

    if (isNaN(page)) {
        page = 1;
    }
    //decrease page number for offset
    page -= 1;

    var limit = parseInt(size);
    var offset = (page * limit);

    var CategoryArray = null;

    //overwrite the original sql and fields to backup also the original sql
    var perpetualAllocationNo = config.inventory.perpetualAllocationNo;
    var systemSafetyThreshold = config.inventory.systemSafetyThreshold;
    var productLowStockThreshold = config.inventory.productLowStockThreshold;

    var params = {
        SystemSafetyThreshold: systemSafetyThreshold,
        ProductLowStockThreshold: productLowStockThreshold,
        PerpetualAllocationNo: perpetualAllocationNo //added derived from stylelist sql
    };

    var where = '1 = 1 ';
    var sq = '';

    Q.when()
        .then(function () {
            if (cu.isBlank(CultureCode)) {
                throw {AppCode: 'MSG_ERR_REQUIRED_FIELD_MISSING'};
            }
        })
        .then(function () {
            return lcat.listAdjacency(tr, CultureCode, false).then(function (data) {
                CategoryListAdjacency = data;
            });
        })
        .then(function () {
            if (!cu.checkIdBlank(MerchantId)) {
                MerchantId = parseInt(MerchantId);
                where = where + " and s.MerchantId=:MerchantId ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(BrandId)) {
                BrandId = parseInt(BrandId);
                where = where + " and s.BrandId=:BrandId ";
            }
        })
        .then(function () {
            if (!cu.isBlank(StyleCode)) {
                where = where + " and s.StyleCode=:StyleCode ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(SkuId)) {
                SkuId = parseInt(SkuId);
                where = where + " and s.SkuId=:SkuId ";
            }
        })
        .then(function () {
            if (!cu.isBlank(SkuCode)) {
                where = where + " and s.SkuCode=:SkuCode ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(StatusId)) {
                StatusId = parseInt(StatusId);
                where = where + " and s.StatusId=:StatusId ";
            }
            else {
                where = where + " and s.StatusId IN (2,3,4) "
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(afterSkuId)) {
                where = where + " and s.SkuId > :AfterSkuId";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(Search)) {
                Search = Search + '%';
                where = where + " and (scu.SkuName like :Search or s.StyleCode like :Search or s.SkuCode like :Search) ";
            }
        })
        .then(function () {
            if (!cu.checkIdBlank(CategoryId)) {
                var tree = lcat.convertTree(CategoryListAdjacency);
                var subtree = lcat.findSubtree(tree, CategoryId);
                var catarray = lcat.subtreeCategoryArray(subtree);
                var cin = catarray.join();
                cin = cin.replace(/[;\']/g, '###'); //don't allow literal quote, or semi colons put triple hash in to show the error
                // where = where + " and scat.CategoryId in ({cin})";
                where = where + " and s.SkuId in (select SkuId from SkuCategory where CategoryId in ({cin}))";
                where = where.replace('{cin}', cin);
            }
        })
        .then(function () {
            return li.setParamStatus(params, tr);
        })
        .then(function () {

            sq = skuListQueryBuilder.getDataQuery(where, offset, limit);

            params.MerchantId = MerchantId;
            params.CultureCode = CultureCode;
            params.StatusId = StatusId;
            params.SkuId = SkuId;
            params.SkuCode = SkuCode;
            params.StyleCode = StyleCode;
            params.Search = Search;
            params.BrandId = BrandId;
            params.AfterSkuId = afterSkuId;
            // console.log(tr.client.prepare(sq)(params));

            return tr.queryMany(sq, params).then(function (data) {
                ProductList = data;
            });
        })
        .then(function () { //sku logic from stylist sku logic remove others because its for iProd = Stylelist
            let rd = moment();

            for (let iSku of ProductList) {

                //Update inventory status
                iSku.InventoryStatusId = params.NAId;

                if (iSku.LocationCount) {
                    if (iSku.QtyAts === perpetualAllocationNo) {
                        iSku.InventoryStatusId = params.InStockId;
                    } else if (iSku.QtyAts < systemSafetyThreshold * iSku.LocationCount) {
                        iSku.InventoryStatusId = params.OutOfStockId;
                    } else if (iSku.QtyAts <= productLowStockThreshold * iSku.LocationCount) {
                        iSku.InventoryStatusId = params.LowStockId;
                    } else {
                        iSku.InventoryStatusId = params.InStockId;
                    }
                } else {
                    //not have any active inventory location
                    iSku.QtyAts = 0;
                }

                if (cu.isBlank(iSku.QtyAts)) {
                    iSku.QtyAts = 0;
                }
                else {
                    iSku.QtyAts = parseInt(iSku.QtyAts);
                }

                iSku.IsNew = ~~(moment(iSku.LastCreated) >= rd.add(-1, 'months'));
                iSku.IsSale = Factory.checkIsSale(iSku);
            }
        })
        .then(function () {

            if (page == 0 && ProductList.length < size) {
                //if teh user requested the first page and the result are already less that teh pagesize then there is no need to calculate the overal count again
                ProductTotalSize = ProductList.length;
                PageCount = 1;

            }
            else {
                sq = skuListQueryBuilder.getCountQuery(where);

                params.MerchantId = MerchantId;
                params.CultureCode = CultureCode;
                params.StatusId = StatusId;
                params.SkuId = SkuId;
                params.StyleCode = StyleCode;
                params.Search = Search;
                params.BrandId = BrandId;

                return tr.queryOne(sq, params).then(function (data) {
                    ProductTotalSize = data.Total;
                    var PageCountDec = (ProductTotalSize / size);
                    PageCount = parseInt(PageCountDec);
                    if (PageCountDec > PageCount) {
                        PageCount = PageCount + 1;
                    }
                });
            }
        })
        .then(function () {
            deferred.resolve({
                HitsTotal: ProductTotalSize,
                PageTotal: parseInt(PageCount),
                PageSize: parseInt(size),
                PageCurrent: page + 1,
                PageData: ProductList
            });
        })
        .catch(function (err) {
            deferred.reject(err);
        })
        .done();

    return deferred.promise;
};

Factory.activateAllPending = Q.async(function *(MerchantId) {
    MerchantId = parseInt(MerchantId);
    var merchant, skus;
    yield cm.trManager(Q.async(function *(tr) {
        merchant = yield tr.queryOne(`SELECT MerchantId FROM Merchant WHERE MerchantId = :MerchantId AND StatusId = ${CONSTANTS.STATUS.ACTIVE}`, {MerchantId: MerchantId});
        if (!merchant) {
            throw {AppCode: 'MSG_ERR_MERCHANT_INVALID', Message: `MerchantId ${MerchantId}`}
        }
        skus = yield tr.queryMany(
            `SELECT DISTINCT S.SkuId FROM Sku S
            INNER JOIN Sku DS ON
                S.MerchantId = DS.MerchantId AND
                S.StyleCode = DS.StyleCode AND
                DS.IsDefault = 1
            INNER JOIN StyleImage SI ON
                DS.MerchantId = SI.MerchantId AND
                DS.StyleCode = SI.StyleCode AND
                DS.ColorKey = SI.ColorKey AND
                SI.ImageTypeId = 2
            INNER JOIN StyleImage SI1 ON 
                DS.MerchantId = SI1.MerchantId AND
                DS.StyleCode = SI1.StyleCode AND
                SI1.ImageTypeId = 3
            WHERE S.MerchantId = :MerchantId AND S.StatusId = 3`,
            merchant
        );
    }), true);
    for (var sku of skus) {
        yield cm.trManager(function (tr) {
            return tr.queryExecute(`UPDATE Sku SET StatusId = ${CONSTANTS.STATUS.ACTIVE} WHERE SkuId = :SkuId AND StatusId = ${CONSTANTS.STATUS.PENDING}`, sku);
        });
    }
});

var validateSizeAndColor = function (tr, Bale) {

    if (Bale.StatusId === CONSTANTS.STATUS.ACTIVE) {
        return tr.queryOne(`SELECT Count(*) SkuCount FROM Sku WHERE (SkuId=:SkuId Or SkuCode=:SkuCode) AND MerchantId = :MerchantId AND (ColorId = 0 OR SizeId = 0)`
            , Bale
        ).then(function (data) {

            if (data.SkuCount > 0) {
                throw {
                    AppCode: 'MSG_ERR_COLOR_OR_SIZE_INVALID',
                    Message: 'Invalid Size Or Color'
                }
            }
        });
    }
}

Factory.checkStyleStatus = function (tr, Bale) {
    return Q.when()
        .then(function () {
            Bale.StyleCode = cu.convertString(Bale.StyleCode)

            if (_.parseInt(Bale.StatusId) === CONSTANTS.STATUS.DELETED) {
                //dont delete if it has inventory
                return tr.queryOne(`
                    SELECT InventoryLocationId 
                    FROM Inventory i 
                    INNER JOIN Sku s ON i.SkuId = s.SkuId 
                    WHERE s.StyleCode = :StyleCode 
                    AND s.MerchantId = :MerchantId 
                    AND i.StatusId = :StatusId`
                    , {
                        StyleCode: Bale.StyleCode,
                        MerchantId: parseInt(Bale.MerchantId),
                        StatusId: CONSTANTS.STATUS.ACTIVE
                    }).then(function (data) {
                    if (data !== null) {
                        throw {AppCode: "MSG_ERR_DEL_SKU_FOUND_INVENTORY"};
                    }
                });
            }
        })
        .then(function () {
            //check if there is product image when status changes to Active;
            if (Bale.StatusId !== CONSTANTS.STATUS.ACTIVE) {
                return;
            } else {
                return tr.queryOne("select count(StyleImageId) totalAmount from StyleImage where StyleCode = :StyleCode",
                    {StyleCode: Bale.StyleCode}).then(function (data) {
                    if (data.totalAmount === 0) {
                        throw {
                            AppCode: "MSG_ERR_MISS_PRODUCT_IMAGE",
                            Message: "there is no product image, can not active this product!"
                        };
                    }
                    return;
                });
            }
        })
        .then(function () {
            //TODO: may be available to save 0 sizeId or 0 colorId after launch in the future
            return validateSizeAndColor(tr, Bale);
        });
}

Factory.listSkuIdByStyle = function (tr, Bale) {

    Bale.MerchantId = parseInt(Bale.MerchantId);

    return tr.queryMany("SELECT SkuId FROM Sku WHERE MerchantId=:MerchantId and StyleCode=:StyleCode and StatusId IN (2,3,4)", {
        MerchantId: Bale.MerchantId,
        StyleCode: Bale.StyleCode
    })
    .then(function (data) {
        return _.map(data, 'SkuId');
    });
}

Factory.updateSkuStatusBySkuIdList = function (tr, SkuIds, StatusId) {
    if (!Array.isArray(SkuIds) || !SkuIds.length) {
        throw {
            AppCode: 'MSG_ERR_INVALID_FIELD',
            Message: 'StyleCode is not found'
        };
    }
    return tr.queryExecute('UPDATE Sku SET StatusId = :StatusId WHERE SkuId IN (:SkuIds)', {
        SkuIds: SkuIds,
        StatusId: StatusId
    });
}

Factory.validateImage = Q.async(function* (tr, sku){
    var sqlDesc = `
        SELECT COUNT(*) AS TotalDesc
        FROM Sku S INNER JOIN StyleImage SI ON S.StyleCode = SI.StyleCode 
            AND S.MerchantId = SI.MerchantId
        WHERE SI.ImageTypeCode = 'Desc'
            AND S.SkuId =:SkuId
            AND S.MerchantId =:MerchantId
    `;
    var totalDesc = (yield tr.queryOne(sqlDesc, sku)).TotalDesc;
    if(totalDesc === 0)
        throw { AppCode: 'MSG_ERR_MISSING_DESC_IMAGE', Message: 'Missing Desc Images' };
        
    var sqlColor = `
        SELECT COUNT(*) AS TotalColor
        FROM Sku S INNER JOIN StyleImage SI ON S.StyleCode = SI.StyleCode
            AND S.MerchantId = SI.MerchantId
        WHERE SI.ImageTypeCode = 'Color'
            AND S.SkuId =:SkuId
            AND S.MerchantId =:MerchantId
    `;
    var totalColor = (yield tr.queryOne(sqlColor, sku)).TotalColor;    
    if(totalColor === 0)
        throw { AppCode: 'MSG_ERR_MISSING_COLOR_IMAGE', Message: 'Missing Color Images' };
    
    return true;
});

Factory.SkuStatusChange = function (tr, Sku, StatusIdRequested, isActivate) {
    var deferred = Q.defer();
    Q.when()
        .then(function () {
            return tr.queryOne("select s.* from Sku s where (s.SkuId=:SkuId OR (s.SkuCode=:SkuCode AND s.MerchantId=:MerchantId))" +
                (isActivate ?
                "and exists (select MerchantId from Merchant where MerchantId=s.MerchantId and StatusId=:StatusActive) " +
                "and exists (select BrandId from Brand where BrandId=s.BrandId and StatusId=:StatusActive)" : ""),
                _.extend(Sku, {StatusActive: CONSTANTS.STATUS.ACTIVE})).then(function (data) {
                if (data) {
                    Sku = data;
                    if (Sku.StatusId == CONSTANTS.STATUS.DELETED) { //don't perfom if deleted
                        throw {
                            AppCode: "MSG_ERR_SKU_STATUS_INVALID",
                            Message: "Sku status is invalid!"
                        };
                    }
                }
                else {
                    throw {
                        AppCode: "MSG_ERR_SKU_NOT_FOUND",
                        Message: "Sku is not found."
                    };
                }
            })
        })
        .then(function(){
            // MM-32390: validate Color Images & Desc Images if activate
            if(StatusIdRequested === CONSTANTS.STATUS.ACTIVE){
                return Factory.validateImage(tr, Sku);
            }
        })
        .then(function () {
            Sku.StatusId = StatusIdRequested;
            //TODO: may be available to save 0 sizeId or 0 colorId after launch in the future
            return validateSizeAndColor(tr, Sku);
        })
        .then(function () {
            Sku.StatusId = StatusIdRequested;
            //TODO need to change this next line to be doing update WHERE on PK only!!!
            return tr.queryMany(`
                SELECT SkuId 
                FROM Sku 
                WHERE (SkuId=:SkuId OR (SkuCode=:SkuCode AND MerchantId=:MerchantId AND StatusId IN (2,3,4)))
            `, Sku)
            .then(function(SkuIds){
                if (Array.isArray(SkuIds) && SkuIds.length > 0) {
                    return tr.queryExecute(`
                        UPDATE Sku 
                        SET StatusId=:StatusId 
                        WHERE SkuId IN (:SkuIds)
                    `,{
                        StatusId: Sku.StatusId,
                        SkuIds: _.map(SkuIds, 'SkuId')
                    });
                }
            });            
        })
        .then(function () {
            deferred.resolve(Sku);
        })
        .catch(function (err) {
            deferred.reject(err);
        })
        .done();
    return deferred.promise;
};

Factory.skuSave = Q.async(function*(tr, sku, duplicatedSkuMap) {
    var errorCols = yield skuValidator.setAndValidateSku(tr, sku, duplicatedSkuMap);
    if (errorCols) {
        cu.log(logGroup, "info", "ERROR COUNT: " + errorCols.length);
        if (errorCols.length > 0) {
            throw {errors: errorCols};
        }
    }

    if(cu.isBlank(sku.SaleFrom) && !cu.isBlank(sku.SalePriceFrom)){
        sku.SaleFrom = sku.SalePriceFrom;
    }

    if(cu.isBlank(sku.SaleTo) && !cu.isBlank(sku.SalePriceTo)){
        sku.SaleTo = sku.SalePriceTo;
    }

    yield skuManager.saveSku(tr, sku);

    var successResult = {SkuId: parseInt(sku.SkuId + ''), Message: sku.statusMessage};
    return successResult;
});

Factory.getSkuInfo = function (tr, sku) {

    var deferred = Q.defer();
    var SkuInfo = null;

    Q.when()
        .then(function () {
            var params = {CultureCode: sku.CultureCode, MerchantId: parseInt(sku.MerchantId)};
            var sql = "SELECT s.SkuId, s.StyleCode, s.SkuCode, " +
                "s.Barcode, s.BrandId, s.BadgeId, s.SeasonId, s.SizeId, s.ColorId, " +
                "s.GeoCountryId, s.LaunchYear, s.PriceRetail, s.PriceSale, s.SaleFrom, " +
                "s.SaleTo, s.AvailableFrom, s.AvailableTo, s.QtySafetyThreshold, " +
                "s.MerchantId,s.StatusId, " +
                "scat.CategoryId as PrimaryCategoryId, sz.SizeNameInvariant as SizeName, " +
                "s.ColorKey, clc.ColorName, scu.SkuColor, scu.SkuName, " +
                "(SELECT f.ProductImage " +
                "FROM StyleImage f " +
                "INNER JOIN ImageType it ON it.ImageTypeCode = f.ImageTypeCode " +
                "WHERE f.MerchantId = s.MerchantId " +
                "AND f.StyleCode = s.StyleCode " +
                "AND f.Position = 1 " +
                "AND s.MerchantId = :MerchantId " +
                "ORDER BY it.Priority, f.ColorKey LIMIT 1 ) AS ImageDefault " +
                "FROM Sku s " +
                "INNER JOIN SkuCulture scu on (s.SkuId=scu.SkuId and scu.CultureCode=:CultureCode) " +
                "INNER JOIN Brand b on (s.BrandId=b.BrandId) " +
                "INNER JOIN BrandCulture bc on (b.BrandId=bc.BrandId and bc.CultureCode=:CultureCode) " +
                "INNER JOIN Size sz on (s.SizeId=sz.SizeId) " +
                "INNER JOIN Color cl on (s.ColorId=cl.ColorId) " +
                "INNER JOIN ColorCulture clc on (cl.ColorId=clc.ColorId and clc.CultureCode=:CultureCode) " +
                "INNER JOIN SkuCategory scat on (s.SkuId=scat.SkuId and scat.Priority=0) " +
                "INNER JOIN Status st on (s.StatusId=st.StatusId) " +
                "INNER JOIN StatusCulture stc on (st.StatusId=stc.StatusId and stc.CultureCode=:CultureCode) " +
                "WHERE s.StatusId IN (2,3,4) AND s.MerchantId = :MerchantId AND ";

            if (!cu.checkIdBlank(sku.SkuId)) {
                sql += " s.Skuid = :Skuid ";
                params.Skuid = parseInt(sku.SkuId);
            }
            else if (!cu.checkIdBlank(sku.SkuCode)) {
                sql += " s.SkuCode = :SkuCode ";
                params.SkuCode = sku.SkuCode;
            }

            return tr.queryOne(sql, params).then(function (data) {
                SkuInfo = data; //store teh returned user
            });
        })
        .then(function () {
            deferred.resolve(SkuInfo);
        })
        .catch(function (err) {
            deferred.reject(err);
        })
        .done();

    return deferred.promise;
};


Factory.badgeList = function (tr, CultureCode, LastChangedFrom, LastChangedTo) {
    var deferred = Q.defer();
    var BadgeList = null;
    var whereSQL = "";

    if (!cu.isBlank(LastChangedFrom)) {
        if(cu.isBlank(LastChangedTo))
            LastChangedTo='2100-01-01';
        whereSQL = ' AND bd.LastModified between :LastChangedFrom and :LastChangedTo';
    };

    Q.when()
        .then(function () {
            return tr.queryMany("select * from Badge bd, BadgeCulture bdc where bd.BadgeId=bdc.BadgeId and bdc.CultureCode=:CultureCode" + whereSQL, { LastChangedFrom : LastChangedFrom, LastChangedTo : LastChangedTo, CultureCode : CultureCode }).then(function (data) {
                BadgeList = data;
            })
        })
        .then(function () {
            deferred.resolve(BadgeList);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};


Factory.sizeList = function (CultureCode, tr, LastChangedFrom, LastChangedTo) {
    var deferred = Q.defer();
    var SizeList = null;
    var whereSQL = "";

    if (!cu.isBlank(LastChangedFrom)) {
        if(cu.isBlank(LastChangedTo))
            LastChangedTo='2100-01-01';
        whereSQL = 'WHERE sz.LastModified between :LastChangedFrom and :LastChangedTo';
    };

    Q.when()
        .then(function () {
            //return tr.queryMany("select * from Size sz , SizeCulture szc where sz.SizeId=szc.SizeId and szc.CultureCode=:CultureCode", {CultureCode:CultureCode}).then(function(data) {
            let sizeSql = "select sz.SizeId, sz.SizeCode, szc.SizeName, szc.SizeCultureId, sz.SizeNameInvariant, sg.SizeGroupId, sg.SizeGroupCode, sg.SizeGroupNameInvariant, sgc.SizeGroupName, sgc.CultureCode, sz.StatusId, sz.LastCreated, sz.LastModified "
                + "from Size sz "
                + "inner join SizeCulture szc on (sz.SizeId=szc.SizeId and szc.CultureCode=:CultureCode) "
                + "inner join SizeGroup sg on (sz.SizeGroupId=sg.SizeGroupId) "
                + "inner join SizeGroupCulture sgc on (sg.SizeGroupId=sgc.SizeGroupId and sgc.CultureCode=:CultureCode) "+ whereSQL +" ORDER BY sz.Position ASC";
            return tr.queryMany(sizeSql, { LastChangedFrom : LastChangedFrom, LastChangedTo : LastChangedTo, CultureCode : CultureCode }).then(function (data) {
                SizeList = data;
            })
        })
        .then(function () {
            deferred.resolve(SizeList);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};

Factory.sizeGroupList = function (CultureCode, tr, LastChangedFrom, LastChangedTo) {
    var deferred = Q.defer();
    var SizeGroupList = null;
    var whereSQL = "";

    if (!cu.isBlank(LastChangedFrom)) {
        if(cu.isBlank(LastChangedTo))
            LastChangedTo='2100-01-01';
        whereSQL = 'WHERE sg.LastModified between :LastChangedFrom and :LastChangedTo';
    };

    Q.when()
        .then(function () {
            //return tr.queryMany("select * from Size sz , SizeCulture szc where sz.SizeId=szc.SizeId and szc.CultureCode=:CultureCode", {CultureCode:CultureCode}).then(function(data) {
            let sizeGroupSql = "select sg.*, sgc.SizeGroupName from SizeGroup sg  inner join SizeGroupCulture sgc on (sg.SizeGroupId=sgc.SizeGroupId and sgc.CultureCode=:CultureCode) " + whereSQL;
            return tr.queryMany(sizeGroupSql, { LastChangedFrom : LastChangedFrom, LastChangedTo : LastChangedTo, CultureCode : CultureCode }).then(function (data) {
                SizeGroupList = data;
            })
        })
        .then(function () {
            var promises = SizeGroupList.map(function (iRow) {
                return tr.queryMany("select sz.*, szc.SizeName from Size sz inner join SizeCulture szc on (sz.SizeId=szc.SizeId and szc.CultureCode=:CultureCode) and sz.SizeGroupId=:SizeGroupId ORDER BY sz.Position ASC", {
                    SizeGroupId: iRow.SizeGroupId,
                    CultureCode: CultureCode
                }).then(function (data) {
                    iRow.SizeList = data;
                });
            });
            return Q.all(promises);
        })
        .then(function () {
            deferred.resolve(SizeGroupList);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};


Factory.colorList = function (CultureCode, tr, LastChangedFrom, LastChangedTo) {
    var deferred = Q.defer();
    var ColorList = null;
    var whereSQL = "";

    if (!cu.isBlank(LastChangedFrom)) {
        if(cu.isBlank(LastChangedTo))
            LastChangedTo='2100-01-01';
        whereSQL = 'WHERE C.LastModified between :LastChangedFrom and :LastChangedTo';
    };

    Q.when()
        .then(function () {
            return tr.queryMany(`SELECT 
                    C.*, CC.ColorName
                FROM Color C 
                INNER JOIN ColorCulture CC ON C.ColorId=CC.ColorId AND CC.CultureCode=:CultureCode
                {where}
                ORDER BY C.Position ASC
            `.replace('{where}', whereSQL), { LastChangedFrom : LastChangedFrom, LastChangedTo : LastChangedTo, CultureCode : CultureCode }).then(function (data) {
                ColorList = data;
            })
        })
        .then(function () {
            deferred.resolve(ColorList);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};


Factory.checkSkuImport = function (tr, Bale) {

    Bale.MerchantId = parseInt(Bale.MerchantId);

    return Q.when()
        .then(function () {
            var sqlStatement = `SELECT StatusId FROM Merchant WHERE MerchantId=:MerchantId AND StatusId IN (2,3,4)`;
            return tr.queryOne(sqlStatement, {MerchantId: Bale.MerchantId}).then(function (data) {
                if (!data) {
                    throw {AppCode: 'MSG_ERR_MERCHANT_NOT_FOUND'};
                }
                else if (data.StatusId === CONSTANTS.STATUS.INACTIVE) {
                    throw {
                        AppCode: 'MSG_ERR_MERCHANT_INACTIVE',
                        Message: 'Can not create Product for inactive Merchant.'
                    };
                }
            });
        })
        .then(function () {
            var sqlQuery = "SELECT * FROM SkuImport WHERE Guid = :Guid AND MerchantId = :MerchantId";
            return tr.queryOne(sqlQuery, Bale).then(function (data) {
                if (!data) {
                    throw {AppCode: 'MSG_ERR_SKU_IMPORT_NOT_FOUND'};
                }
                else if (data.StatusId === CONSTANTS.STATUS.PENDING) {
                    throw {AppCode: "MSG_ERR_SKU_IMPORT_ALREADY_PROCESS"};
                }
                return data;
            });
        });
};

Factory.processSkuImport = function (SkuData) {
    var filePath = null;
    var tmpFile = null;
    var errorTmpFile = null;
    var SkuList = false;
    var skuMap = null;

    var chunks = {inserted: 0, updated: 0, errors: 0, skipped: 0, total: 0, errorList: []};
    var tmpErrorPath = null;
    var errorFileName = null;

    return Q.when()
        .then(function () {
            filePath = __dirname + '/..' + SkuData.FileLocation;
            var key = SkuData.MerchantId + "_" + SkuData.Guid + ".xlsx";
            tmpFile = cu.getTmpPath(key);
            return cu.removeFileOnEnd(function () {
                return storage.getToLocalFile("sheets", key, tmpFile)
                .then(function () {
                    return commonexcel.toJson(tmpFile, "SKU").then(function (data) {
                        SkuList = data;
                        if (!Array.isArray(SkuList) || SkuList.length == 0)
                            throw {AppCode: 'MSG_ERR_REQUIRED_FIELD_MISSING'};
                    });
                });
            }, tmpFile);
        })
        .then(function () {
            // if (!SkuList || SkuList.length==0)
            //     throw { AppCode: '"MSG_ERR_IMPORT_SKU_EMPTY_FAIL"' };

            //all data of importing has error, no need to continue the flow
            // if (chunks.errorList.length > 0) {
            //     chunks["errors"] += chunks.errorList.length;
            //     if (chunks.errorList.length === SkuList.length) {
            //         chunks.total = chunks.errorList.length;
            //         return;
            //     }
            // }

            var rowNumber = 1;
            // comment out duplicated check until spec ready
            // var duplicatedSkuMap = Factory.findDuplicatedSku(SkuList);
            var promises = SkuList.map(throat(1, function (item) {
                //ignore if item has error
                chunks["total"] += 1;

                // if (!item.IsError) {
                item.MerchantId = SkuData.MerchantId;
                item.Overwrite = SkuData.Overwrite;
                item.SkuCode = item.SkuCode || item.SKU;

                item.SkuCode=cu.convertString(item.SkuCode);
                item.StyleCode=cu.convertString(item.StyleCode);

                if (cu.isBlank(item.PriceRetail) && !cu.isBlank(item.RetailPrice)) {
                    item.PriceRetail = item.RetailPrice;
                }

                if (!cu.isBlank(item.PriceRetail) && _.isNumber(item.PriceRetail)) {
                    item.PriceRetail = item.PriceRetail.toFixed(2);
                }

                if (!cu.isBlank(item.PriceSale) && _.isNumber(item.PriceSale)) {
                    item.PriceSale = item.PriceSale.toFixed(2);
                }

                cu.log(logGroup, "info", "-Import going to save Row=" + rowNumber++ + " SkuCode=" + item.SkuCode);

                item.IsImport = true;

                let childTr = new cm();
                return childTr.begin()
                    .then(function () {
                        // comment out duplicated check until spec ready
                        // return Factory.skuSave(childTr, item, duplicatedSkuMap);
                        return Factory.skuSave(childTr, item);
                    }).then(function (saveResult) {
                        chunks[saveResult.Message] += 1;
                        return childTr.commit();
                    }).catch(function (err) {
                        if (err.errors) {
                            chunks["errors"] += 1;
                            var errors = _.cloneDeep(item);

                            if (Array.isArray(err.errors)) {
                                var tmp = {AppCode: [], Message: [], ErrorMessageEN: []};
                                err.errors.forEach(function (e, i) {
                                    tmp.AppCode.push(e.AppCode);
                                    tmp.Message.push(e.Message);
                                    tmp.ErrorMessageEN.push((i + 1) + ". " + e.AppCode + ": " + e.Message);
                                });

                                errors.AppCode = tmp.AppCode.join(', ');
                                errors.Message = tmp.Message.join(', ');
                                errors.ErrorMessageEN = tmp.ErrorMessageEN.join('\n');
                            } else {
                                errors.AppCode = err.errors.AppCode;
                                errors.Message = err.errors.Message;
                                errors.ErrorMessageEN = err.errors.AppCode + ": " + err.errors.Message;
                            }

                            chunks.errorList.push(errors);
                        }

                        return childTr.rollback();
                    });
            }));

            return Q.all(promises);
        })
        .then(function () {
        	if (chunks && chunks.errorList && chunks.errorList.length > 0) {
	            errorFileName = SkuData.MerchantId + "_";
	            errorFileName += SkuData.Guid + "_";
	            errorFileName += new Date().getTime() + ".xlsx";

	            tmpErrorPath = '/uploads/sheeterrors/' + errorFileName;

	            var header = JSON.parse(JSON.stringify(Factory.SkuHeader));
	            header.unshift( { field : "rowNumber", name : "Row Number" } );
	            header.push( { field : "ErrorMessageEN", name : "Error message" } );

                errorTmpFile = cu.getTmpPath(errorFileName);
                return cu.removeFileOnEnd(function () {
                    return commonexcel.writeExcelFile(errorTmpFile, header, chunks.errorList, 'SKU').then(function(res){
                        return storage.storeFromLocalFile('sheeterrors', errorFileName, errorTmpFile);
                    });
                }, errorTmpFile);
        	}
        })
        .then(function () {
            return {
                ImportId: SkuData.ImportId,
                ErrorLocation: tmpErrorPath,
                ErrorFileName: errorFileName,
                chunks: chunks,
                StatusId: CONSTANTS.STATUS.ACTIVE
            }
        });
};

Factory.updateSkuImport = function (tr, result) {
    var chunks = result.chunks;
    if (chunks) {
        return tr.queryExecute(`
            UPDATE SkuImport
            SET ErrorLocation=:ErrorLocation,
                ErrorCounts=:ErrorCounts,
                SkippedCounts=:SkippedCounts,
                UpdateCounts=:UpdateCounts,
                InsertCounts=:InsertCounts,
                TotalCounts=:TotalCounts,
                StatusId=:StatusId
            WHERE ImportId=:ImportId
        `, {
            ImportId: result.ImportId,
            ErrorLocation: result.ErrorLocation,
            ErrorCounts: chunks.errors || 0,
            SkippedCounts: chunks.skipped || 0,
            UpdateCounts: chunks.updated || 0,
            InsertCounts: chunks.inserted || 0,
            TotalCounts: chunks.total || 0,
            StatusId: result.StatusId
        });
    } else {
        return tr.queryExecute("UPDATE SkuImport SET ErrorLocation=:ErrorLocation, StatusId=:StatusId WHERE ImportId=:ImportId", {
            ImportId: result.ImportId,
            ErrorLocation: result.ErrorLocation,
            StatusId: result.StatusId
        });
    }
};

// skus: skuimport_q by adding to rabbit mq
Factory.rabbitMQAddtoSkuImportQ = Q.async(function* (data) {
    return yield lr.addtoQueue('skuimport_q', data);
});

Factory.getFromList = function(List, Id, Find){
	if (!(List.length > 0))
		return null;

	var data = null;
	for ( var i = 0; i < List.length; i++ ){
		if (List[i][Id] == Find){
			data = List[i];
		};
	};
	return data;
};

Factory.listSkuExport = function (tr, Bale) {
    var page = parseInt(Bale['page']) || 1;
    var size = parseInt(Bale['size']) || 200000;

    var MerchantId = Bale.merchantid;
    var CategoryId = Bale.categoryid;
    var CultureCode = Bale.cc;
    var BrandList = null;
    var BadgeList = null;
    var SeasonList = null;
    var SizeList = null;
    var ColorList = null;
    var GeoCountryList = null;

    var fileName = MerchantId + "_" + Date.now() + ".xlsx";
    var tmpFile = cu.getTmpPath(fileName);
    var header = JSON.parse(JSON.stringify(Factory.SkuHeader));
    var writer = new commonexcel.ExcelWriter(tmpFile, header, 'SKU');

    return Q.when()
        .then(function(){
            var sqlBrand = `
                SELECT B.BrandId, B.BrandCode
                FROM Brand B INNER JOIN MerchantBrand MB ON B.BrandId = MB.BrandId
                WHERE 	B.StatusId <> 1
                    AND MB.StatusId <> 1
                    AND MB.MerchantId = :MerchantId
            `;
            return tr.queryMany(sqlBrand, {MerchantId: MerchantId}).then(function (data) {
                BrandList = data;
            });
        })
        .then(function(){
            return tr.queryMany(`SELECT BadgeId, BadgeCode FROM Badge`).then(function (data) {
                BadgeList = data;
            });
        })
        .then(function(){
            return tr.queryMany(`SELECT SeasonId, SeasonCode FROM Season`).then(function (data) {
                SeasonList = data;
            });
        })
        .then(function () {
            var sqlSize = `
                SELECT SizeId, SizeCode, sg.SizeGroupId, SizeGroupCode 
                FROM Size s, SizeGroup sg 
                WHERE s.SizeGroupId=sg.SizeGroupId
            `;
            return tr.queryMany(sqlSize).then(function (data) {
                SizeList = data;
            });
        })
        .then(function () {
            return tr.queryMany(`SELECT ColorId, ColorCode FROM Color`).then(function (data) {
                ColorList = data;
            });
        })
        .then(function () {
            return tr.queryMany(`SELECT GeoCountryId, CountryCode AS CountryOriginCode FROM GeoCountry`).then(function (data) {
                GeoCountryList = data;
            });
        })
        // by SkuId limit
        .then(function(){
            var currentSize = 0;
            function loopSku (batchSize, lastSkuId) {
                if (batchSize > 0) {
                    return Factory.skuList(tr, MerchantId, 0, '', CategoryId, '', 0, '', '', CultureCode, page, batchSize, lastSkuId)
                    .then(function (response) {
                        var result = response.PageData;
                        return processBatch(result);
                    })
                    .then(function (result) {
                        currentSize += result.length;
                        writer.write(result);
                        if (result.length >= batchSize) {
                            lastSkuId = _.last(result).SkuId;
                            if (cu.checkIdBlank(lastSkuId)) {
                                throw { AppCode: 'MSG_ERR_SKU_EXPORT' };
                            }
                            return loopSku(Math.min(batchSize, size - currentSize), lastSkuId);
                        }
                    });

                }
            }
            function processBatch (SkuList) {
                // console.log('Export started, Throat: ', (config.defaultThroat || 1));
                var promises = SkuList.map(throat((config.defaultThroat || 1), function (item) {
                    return Q.when()
                        .then(function () {
                            // set values to prevent undefined/null value being generated in excel..
                            item.SKUStatus = Factory.getSkuStatus(item.StatusId);
                            item.PrimaryCategoryCode = "";
                            item.MerchandisingCategoryCode1 = "";
                            item.MerchandisingCategoryCode2 = "";
                            item.MerchandisingCategoryCode3 = "";
                            item.MerchandisingCategoryCode4 = "";
                            item.MerchandisingCategoryCode5 = "";
                            if (cu.isBlank(item.SaleFrom) || !cu.isValidDate(item.SaleFrom)) {
                                item.SalePriceFrom = "";
                            }
                            else{
                                item.SalePriceFrom = item.SaleFrom;
                            }
                            if (cu.isBlank(item.SaleTo) || !cu.isValidDate(item.SaleTo)) {
                                item.SalePriceTo = "";
                            }
                            else{
                                item.SalePriceTo = item.SaleTo;
                            }
                            if (cu.isBlank(item.AvailableFrom) || !cu.isValidDate(item.AvailableFrom)) {
                                item.AvailableFrom = "";
                            }
                            if (cu.isBlank(item.AvailableTo) || !cu.isValidDate(item.AvailableTo)) {
                                item.AvailableTo = "";
                            }
                            if (cu.isBlank(item.QtySafetyThreshold)) {
                                item.QtySafetyThreshold = 0;
                            }
                            if (cu.isBlank(item.PriceSale) || item.PriceSale === 0) {                            
                                item.PriceSale = '';
                            }
                            if (cu.isBlank(item.PriceRetail)) {
                                item.RetailPrice = 0;
                            }
                            else{
                                item.RetailPrice = item.PriceRetail;
                            }
                            return;
                        })
                        .then(function () {
                            var Brand = Factory.getFromList(BrandList, 'BrandId', item.BrandId);
                            item.BrandCode = (Brand && Brand.BrandCode) ? Brand.BrandCode : "";
                        })
                        .then(function () {
                            var Badge = Factory.getFromList(BadgeList, 'BadgeId', item.BadgeId);
                            item.BadgeCode = (Badge && Badge.BadgeCode) ? Badge.BadgeCode : "";
                        })
                        .then(function () {
                            var Season = Factory.getFromList(SeasonList, 'SeasonId', item.SeasonId);
                            item.SeasonCode = (Season && Season.SeasonCode) ? Season.SeasonCode : "";
                        })
                        .then(function () {
                            var Size = Factory.getFromList(SizeList, 'SizeId', item.SizeId);
                            item.SizeCode = (Size && Size.SizeCode) ? Size.SizeCode : "";
                            item.SizeGroupCode = (Size && Size.SizeGroupCode) ? Size.SizeGroupCode : "";
                        })
                        .then(function () {
                            var Color = Factory.getFromList(ColorList, 'ColorId', item.ColorId);
                            item.ColorCode = (Color && Color.ColorCode) ? Color.ColorCode : "";
                        })
                        .then(function () {
                            var GeoCountry = Factory.getFromList(GeoCountryList, 'GeoCountryId', item.GeoCountryId);
                            item.CountryOriginCode = (GeoCountry && GeoCountry.CountryOriginCode) ? GeoCountry.CountryOriginCode : "";
                        })
                        .then(function () {
                            var sqlQuery = `
                                SELECT SkuCategory.Priority, SkuCategory.CategoryId, Category.CategoryId, Category.CategoryCode 
                                FROM SkuCategory LEFT JOIN Category ON Category.CategoryId = SkuCategory.CategoryId 
                                WHERE SkuId = :SkuId
                            `;
                            return tr.queryMany(sqlQuery, {SkuId: item.SkuId}).then(function (data) {
                                for (var i = 0; i < data.length; i++) {
                                    var Priority = parseInt(data[i].Priority);
                                    if (Priority == 0) {
                                        item.PrimaryCategoryCode = data[i].CategoryCode || "";
                                    } else {
                                        item["MerchandisingCategoryCode" + ( Priority)] = data[i].CategoryCode && data[i].CategoryCode != "CAT0" ? data[i].CategoryCode : "";
                                    }
                                }
                            });
                        })
                        .then(function () {
                            var sqlQuery = "SELECT * FROM SkuCulture WHERE SkuId = :SkuId";
                            return tr.queryMany(sqlQuery, {SkuId: item.SkuId}).then(function (data) {
                                var tmp = {
                                    SkuName: "SkuName",
                                    SkuDesc: "Description",
                                    SkuSizeComment: "SizeComment",
                                    SkuColor: "ColorName"
                                };

                                // var tmpCulture = {
                                //     "EN" : "English", "CHT" : "Hant", "CHS" : "Hans"
                                // };

                                for (var i = 0; i < data.length; i++) {
                                    for (var key in tmp) {
                                        // item[ tmp[key] + "-" + tmpCulture[data[i].CultureCode] ] = data[i][key];
                                        item[tmp[key] + "-" + data[i].CultureCode] = data[i][key];
                                    }
                                }
                            });
                        })
                }));
                return Q.all(promises).then(function () {
                    return SkuList;
                });
            }
            // batch size 500
            return loopSku(500).then(function () {
                if (currentSize <= 0) {
                    throw {AppCode: "No Product to export"};
                }
            });
        })
        .then(function () {
            return { fileName, tmpFile, writer };
        });
};
    
Factory.processSkuExport = function ({ fileName, tmpFile, writer }) {
    return cu.removeFileOnEnd(function () {
        return writer.save()
        .then(function () {
            return storage.storeFromLocalFile('sheetexports', fileName, tmpFile);
        })
    }, tmpFile);
};

//validate product input before create or update product
// Factory.validateProductInputBeforeSave = function (tr, style, isStyleCodeChanged, originalStyleCode, isNew) {
//     //1.1check input
//     if (cu.isBlank(style.StyleCode)) {
//         throw {
//             AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
//             Message: 'Missing StyleCode'
//         };
//     }
//
//     var defaultSku = style.SkuList.filter(function (sku) {
//         return sku.IsDefault === 1;
//     })[0];
//
//     if (cu.isBlank(defaultSku)) {
//         throw {
//             AppCode: 'MSG_ERR_SKU_ISDEFAULT',
//             Message: 'Missing default sku'
//         };
//     }
//
//     Object.keys(CONSTANTS.CULTURE_CODE).forEach(function (cultureCode) {
//         if (cu.isBlank(defaultSku.SkuCulture) || cu.isBlank(defaultSku.SkuCulture[cultureCode].SkuName)) {
//             throw {
//                 AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
//                 Message: 'Missing SkuCulture[' + cultureCode + '].SkuName'
//             };
//         }
//     });
//
//     if (cu.isBlank(style.BrandId)) {
//         throw {
//             AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
//             Message: 'Missing BrandId'
//         };
//     }
//
//     if (cu.isBlank(style.PriceRetail)) {
//         throw {
//             AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
//             Message: 'Missing PriceRetail'
//         };
//     }
//     if (cu.isBlank(style.CategoryPriorityList[0].CategoryId)) {//Primary category is mandatory
//         throw {
//             AppCode: 'MSG_ERR_COMPULSORY_FIELD_MISSING',
//             Message: 'Missing Primary category'
//         };
//     }
//     if (style.SkuList.length === 0) {//At least there should be one sku
//         throw {
//             AppCode: 'MSG_ERR_SKU_NIL'
//         };
//     }
//
//     var statusCheckPromise = style.SkuList.map(function (sku) {
//         return tr.queryOne('select SkuId from Sku where SkuId=:SkuId and StatusId=:StatusId',
//             {SkuId: sku.SkuId, StatusId: CONSTANTS.STATUS.DELETED}).then(function (data) {
//             if (data !== null) {
//                 throw {
//                     AppCode: 'MSG_ERR_PRODUCT_NOT_FOUND'
//                 };
//             }
//         });
//     });
//
//     var brandCheckPromise = isNew ? tr.queryOne('select BrandId from Brand where BrandId=:BrandId and StatusId<>:StatusId',
//         {BrandId: style.BrandId, StatusId: CONSTANTS.STATUS.PENDING}).then(function (data) {
//         if (data === null) {
//             throw {
//                 AppCode: 'MSG_ERR_BRAND_STATUS_PENDING'
//             };
//         }
//     }) : Q.resolve(true);
//
//     var tmpSkuCodeArray = [];
//     style.SkuList.forEach(function (sku) {//Sku code is mandatory
//         if (cu.isBlank(sku.SkuCode)) {
//             throw {
//                 AppCode: 'MSG_ERR_SKU_SKUCODE_NIL'
//             };
//         }
//         if (tmpSkuCodeArray.indexOf(sku.SkuCode) == -1) {
//             tmpSkuCodeArray.push(sku.SkuCode);
//         } else {
//             throw {
//                 AppCode: 'MSG_ERR_PRODUCT_SKUCODE_UNIQUE_WITHIN_MERCHANT',
//                 Message: {SkuCode: sku.SkuCode}
//             };
//         }
//     });
//
//     var tmpBarCodeArray = [];
//     style.SkuList.forEach(function (sku) {
//         if (cu.isBlank(sku.Barcode)) {
//             return;
//         }
//         if (tmpBarCodeArray.indexOf(sku.Barcode) == -1) {
//             tmpBarCodeArray.push(sku.Barcode);
//         } else {
//             throw {
//                 AppCode: 'MSG_ERR_PRODUCT_BARCODE_UNIQUE_WITHIN_MERCHANT',
//                 Message: {Barcode: sku.Barcode}
//             };
//         }
//     });
//
//     //check if style code is unique.
//     var styleCodeCheckPromise;
//     if (isStyleCodeChanged) {
//         //1.2checking if style code is unique;
//         var sqlQuery = "SELECT COUNT(SkuId) totalAmount FROM Sku WHERE StyleCode=:StyleCode AND MerchantId=:MerchantId";
//         styleCodeCheckPromise = tr.queryMany(sqlQuery, {
//             StyleCode: style.StyleCode,
//             MerchantId: style.MerchantId
//         }).then(function (data) {
//             if (data[0].totalAmount > 0) {
//                 throw {
//                     AppCode: 'MSG_ERR_PRODUCT_STYLECODE_UNIQUE'
//                 };
//             }
//         });
//     }
//
//     //check if skucode is unique within merchant.
//     var skuCodeCheckPromises = style.SkuList.map(function (sku) {//Sku code is mandatory
//         var sqlQuery = "SELECT COUNT(SkuId) totalAmount FROM Sku WHERE SkuCode=:SkuCode and MerchantId=:MerchantId and SkuId!=:SkuId";
//         if (cu.isBlank(sku.SkuId)) {
//             sqlQuery = "SELECT COUNT(SkuId) totalAmount FROM Sku WHERE SkuCode=:SkuCode and MerchantId=:MerchantId";
//         }
//         return tr.queryMany(sqlQuery, {
//             SkuCode: sku.SkuCode,
//             MerchantId: style.MerchantId,
//             SkuId: sku.SkuId
//         }).then(function (data) {
//             if (data[0].totalAmount > 0) {
//                 throw {
//                     AppCode: 'MSG_ERR_PRODUCT_SKUCODE_UNIQUE_WITHIN_MERCHANT',
//                     Message: {SkuCode: sku.SkuCode}
//                 };
//             }
//         });
//     });
//
//     //check if barcode is unique within merchant.
//     var barCodeCheckPromises = style.SkuList.map(function (sku) {//bar code is mandatory
//         if (cu.isBlank(sku.Barcode)) {
//             return;
//         }
//         var sqlQuery = "SELECT COUNT(SkuId) totalAmount FROM Sku WHERE Barcode=:Barcode and MerchantId=:MerchantId and SkuId!=:SkuId";
//         if (cu.isBlank(sku.SkuId)) {
//             sqlQuery = "SELECT COUNT(SkuId) totalAmount FROM Sku WHERE Barcode=:Barcode and MerchantId=:MerchantId";
//         }
//         return tr.queryMany(sqlQuery, {
//             Barcode: sku.Barcode,
//             MerchantId: style.MerchantId,
//             SkuId: sku.SkuId
//         }).then(function (data) {
//             console.log(data[0].totalAmount > 0);
//             if (data[0].totalAmount > 0) {
//                 throw {
//                     AppCode: 'MSG_ERR_PRODUCT_BARCODE_UNIQUE_WITHIN_MERCHANT',
//                     Message: {Barcode: sku.Barcode}
//                 };
//             }
//         });
//     });
//
//     var promises = [];
//     promises = promises.concat(statusCheckPromise, brandCheckPromise, styleCodeCheckPromise, skuCodeCheckPromises, barCodeCheckPromises);
//     return Q.all(promises);
// };

//setting default value for creating or update product
// Factory.settingProductDefaultValue = function (style) {
//     //check and set default value for SeasonId
//     if (cu.isBlank(style.SeasonId)) {
//         style.SeasonId = 0
//     }
//     //check and set default value for BadgeId
//     if (cu.isBlank(style.BadgeId)) {
//         style.BadgeId = 0
//     }
//     //check and set default value for GeoCountry
//     if (cu.isBlank(style.GeoCountryId)) {
//         style.GeoCountryId = 0
//     }
//     //check and set default value for LaunchYear
//     if (cu.isBlank(style.LaunchYear) || style.LaunchYear === 0) {
//         style.LaunchYear = null;
//     }
//     //check and set default value for PriceSale
//     if (cu.isBlank(style.PriceSale)) {
//         style.PriceSale = null;
//     }
//     //check and set default value for IsDefault
//     if (cu.isBlank(style.IsDefault)) {
//         style.IsDefault = 0
//     }
//     style.SkuList.forEach(function (sku) {
//         if (cu.isBlank(sku.IsDefault)) {
//             sku.IsDefault = 0;
//         }
//     });
// };

/**
 * check if a style has set default sku
 * @param styleCode
 * @param tr
 * @return boolean true-has default sku; false-do not has default sku
 */
Factory.checkHasDefaultSku = function (tr, styleCode, merchantId) {
    merchantId = parseInt(merchantId);
    var deferred = Q.defer();
    var hasDefaultSku = false;
    Q.when()
        .then(function () {
            var sql = 'SELECT COUNT(SkuId) TotalNum FROM Sku WHERE StyleCode=:StyleCode AND IsDefault=1 AND MerchantId=:MerchantId';
            return tr.queryOne(sql, {
                StyleCode: styleCode,
                MerchantId: merchantId
            }).then(function (data) {
                if (data.TotalNum > 0) {
                    hasDefaultSku = true;
                }
            });
        })
        .then(function () {
            deferred.resolve(hasDefaultSku);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * get default sku with the same style code
 *
 * @param   object      tr           Connection
 * @param   string      styleCode    Style code
 * @param   number      merchantId   Merchant id
 *
 * @return  string                   Return default sku code or null if not exist
 */
Factory.getDefaultSku = function (tr, styleCode, merchantId) {
    merchantId = parseInt(merchantId);
    var deferred = Q.defer();
    var skuCode = null;
    Q.when()
        .then(function () {
            var sql = 'SELECT SkuCode FROM Sku WHERE StyleCode=:StyleCode AND MerchantId=:MerchantId AND IsDefault=1';
            return tr.queryOne(sql, {StyleCode: styleCode, MerchantId: merchantId}).then(function (data) {
                if (data.SkuCode) {
                    skuCode = data.SkuCode;
                }
            });
        })
        .then(function () {
            deferred.resolve(skuCode);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * get default skus with the same style code
 *
 * @param   object      tr           Connection
 * @param   string      styleCode    Style code
 * @param   number      merchantId   Merchant id
 *
 * @return  object[]    result       Return list of skus or null if not exist
 */
Factory.getSkuByStyleCode = function (tr, styleCode, merchantId) {
    merchantId = parseInt(merchantId);
    var deferred = Q.defer();
    var dbSkus = null;
    Q.when()
        .then(function () {
            var sql = 'SELECT StyleCode, Barcode, SkuCode, IsDefault FROM Sku WHERE StyleCode=:StyleCode AND MerchantId=:MerchantId AND StatusId IN (2,3,4)';
            return tr.queryMany(sql, {StyleCode: styleCode, MerchantId: merchantId}).then(function (data) {
                if (data) {
                    dbSkus = data;
                }
            });
        })
        .then(function () {
            deferred.resolve(dbSkus);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * check valid importing data and map data to group by stylecode
 *
 * @param   object      tr           Connection
 * @param   object[]    skuList      The list of sku object
 *
 * @return  object(Map)    skuMap    Return map reduced Object
 */
// Factory.checkValidImportData = function (tr, skuList, chunks) {
//     var skuMap = new Map();
//     //reduce to map based by key is StyleCode
//     for (var i = 0; i < skuList.length; i++) {
//         var currentSku = skuList[i];
//
//         //convert datetime type
//         // currentSku.AvailableFrom = cu.convertToDate(currentSku.AvailableFrom);
//         // currentSku.AvailableTo = cu.convertToDate(currentSku.AvailableTo);
//         // currentSku.SalePriceFrom = cu.convertToDate(currentSku.SalePriceFrom);
//         // currentSku.SalePriceTo = cu.convertToDate(currentSku.SalePriceTo);
//
//         //check launch year
//         // if (!Factory.isBlank(currentSku.LaunchYear) && !moment(currentSku.LaunchYear, "YYYY", true).isValid()) {
//         //     currentSku.IsError = true;
//         //     currentSku.LaunchYear = CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID + currentSku.LaunchYear;
//         //     chunks.errorList = chunks.errorList.concat(currentSku);
//         // }
//
//         // checking valid sku status
//
//         //size code
//         // if (!cu.isBlank(currentSku.SizeCode)) {
//         //     currentSku.SizeCode = currentSku.SizeCode.toString();
//         // }
//
//         //size group code
//         // if (!cu.isBlank(currentSku.SizeGroupCode)) {
//         //     currentSku.SizeGroupCode = currentSku.SizeGroupCode.toString();
//         // }
//         //
//         // if (currentSku.SKUStatus) {
//         //     currentSku.StatusId = Factory.getSkuStatusId(currentSku.SKUStatus.toString());
//         //     if (currentSku.StatusId == -1) {
//         //         currentSku.IsError = true;
//         //         currentSku.SKUStatus = CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID + currentSku.SKUStatus;
//         //         chunks.errorList = chunks.errorList.concat(currentSku);
//         //     }
//         // }
//         //
//         // if (!(currentSku.IsDefault.toString() == '0' || currentSku.IsDefault.toString() == '1')) {
//         //     currentSku.IsError = true;
//         //     currentSku.IsDefault = CONSTANTS.EXCEL.ERROR_CODE.NOT_VALID + currentSku.IsDefault;
//         //     chunks.errorList = chunks.errorList.concat(currentSku);
//         // }
//
//         var currentMap = skuMap.get(currentSku.StyleCode.toString());
//         if (!currentMap) {
//             currentMap = {data: [currentSku]};
//             skuMap.set(currentSku.StyleCode.toString(), currentMap);
//         }
//         else {
//             // if (!currentSku.IsDefault) {
//             //     currentSku.IsDefault = 0;
//             // }
//             currentMap.data.push(currentSku);
//         }
//     }
//
//     return skuMap;
// };

/**
 * count isDefault per stylecode group
 *
 * @param   object      mapElement           elment of Map
 *
 */
// Factory.countIsDefault = function (mapElement) {
//     _.each(mapElement.DbSkus, function (elem) {
//         if (elem.IsDefault == 1) {
//             mapElement.IsDefaultInDb = elem;
//         }
//         mapElement.data.forEach(function (item) {
//             if (elem.SkuCode == item.SkuCode) {
//                 elem.IsDefault = item.IsDefault;
//                 if (item.IsDefault && item.IsDefault.toString() == '1') {
//                     mapElement.IsDefaultFromImport = item;
//                 }
//             }
//         });
//     });
//
//     if (mapElement.DbSkus && mapElement.DbSkus.length > 0) {
//         _.each(mapElement.DbSkus, function (elem) {
//             if (elem.IsDefault && elem.IsDefault.toString() == '1') {
//                 mapElement.CountIsDefault += 1;
//             }
//         });
//     }
//     else {
//         mapElement.data.forEach(function (item) {
//             if (item.IsDefault && item.IsDefault.toString() == '1') {
//                 mapElement.CountIsDefault += 1;
//             }
//         });
//     }
// };

/**
 * update isDefault of sku with the same style code
 *
 * @param   object      tr           Connection
 * @param   string      skuCode      Sku code
 * @param   number      merchantId   Merchant id
 *
 * @return  boolean                  Return true or false indicate success or not of updating
 */
// Factory.updateIsDefault = function (tr, skuCode, merchantId) {
//     var deferred = Q.defer();
//     var isSuccess = false;
//     Q.when()
//         .then(function () {
//             console.log("updateIsDefault - updateIsDefault - skuCode");
//             console.log(skuCode);
//             var sql = 'UPDATE Sku SET IsDefault = 0 WHERE SkuCode=:SkuCode AND MerchantId=:MerchantId';
//             return tr.queryExecute(sql, {SkuCode: skuCode, MerchantId: merchantId}).then(function (data) {
//                 isSuccess = true;
//             });
//         })
//         .then(function () {
//             deferred.resolve(isSuccess);
//         })
//         .catch(function (err) {
//             deferred.reject(err);
//         });
//     return deferred.promise;
// };

/**
 *
 * Get active skuId by skuCode and merchantId
 *
 * @param   Connection    tr            Connection object
 * @param   string        skuCode       SkuCode
 * @param   integer       merchantId    Merchant Id
 * @param   integer       [StatusId]    Status Id
 *
 * @see     Factory.getSkuInfo
 *
 * @return  Promise(integer, object)    Resolve: SkuId (if not exist, return null)
 *                                      Reject: Error object
 *
 */
Factory.getSkuIdBySkuCode = function (tr, SkuCode, MerchantId, StatusId) {
    MerchantId = parseInt(MerchantId);
    var deferred = Q.defer();
    var SkuId = null;
    Q.when()
        .then(function () {
            var Bale = {
                SkuCode: SkuCode,
                MerchantId: MerchantId
            };

            var sql = "SELECT s.SkuId " +
                "FROM Sku s " +
                "WHERE s.SkuCode = :SkuCode AND s.MerchantId = :MerchantId";

            if (cu.isUndefined(StatusId)) {
                sql += ' and s.StatusId IN (2,3,4) ';
            }
            else {
                StatusId = parseInt(StatusId);
                sql += ' and s.StatusId = :StatusId ';
                Bale['StatusId'] = StatusId;
            }

            return tr.queryOne(sql, Bale);
        })
        .then(function (data) {
            if (data != null) {
                SkuId = data.SkuId;
            }

            deferred.resolve(SkuId);
        })
        .catch(function (err) {
            deferred.reject(err);
        })
        .done();

    return deferred.promise;
};

Factory.saveImages = Q.async(function*(tr, style, isImageChanged) {
    if (isImageChanged) {
        style.MerchantId = parseInt(style.MerchantId);
        //3.1 edit product delete style images first
        var StyleImageIds = yield tr.queryMany('SELECT StyleImageId FROM StyleImage WHERE StyleCode=:StyleCode AND MerchantId=:MerchantId', style);
        if (Array.isArray(StyleImageIds) && StyleImageIds.length > 0) {
            yield tr.queryExecute('DELETE FROM StyleImage WHERE StyleImageId IN (:StyleImageIds)', {
                StyleImageIds: _.map(StyleImageIds, 'StyleImageId')
            });
        }

        var styleImageInsertSQL = 'INSERT INTO StyleImage (`MerchantId`, `StyleCode`, `ImageTypeCode`, `ImageTypeId`, ' +
            '`ColorKey`, `ProductImage`, `Position`, StatusId) values (:MerchantId, :StyleCode, :ImageTypeCode, :ImageTypeId, ' +
            ':ColorKey, :ImageKey, :Position, 2)';

        //4.1store description images
        for (var descriptionImage of style.DescriptionImageList) {
            descriptionImage.MerchantId = style.MerchantId;
            descriptionImage.StyleCode = style.StyleCode;
            descriptionImage.ImageTypeCode = CONSTANTS.PRODUCT_IMG_TYPE_CODE.DESC;
            descriptionImage.ImageTypeId = CONSTANTS.PRODUCT_IMG_TYPE.DESC;
            yield tr.queryExecute(styleImageInsertSQL, descriptionImage);
        }
        //4.2store color images
        var colorList = Object.keys(style.ColorImageListMap);
        for (var colorKey of colorList) {
            var colorImageList = style.ColorImageListMap[colorKey];
            for (var colorImage of colorImageList) {
                colorImage.MerchantId = style.MerchantId;
                colorImage.StyleCode = style.StyleCode;
                colorImage.ImageTypeCode = CONSTANTS.PRODUCT_IMG_TYPE_CODE.COLOR;
                colorImage.ImageTypeId = CONSTANTS.PRODUCT_IMG_TYPE.COLOR;
                colorImage.ColorKey = cu.formatColorKey(colorImage.ColorKey);
                yield tr.queryExecute(styleImageInsertSQL, colorImage);
            }
        }
    }
});

/**
 *
 * Get All users liked products
 *
 * @param   Connection    tr            Connection object
 * @param   string        StyleCode       All products with stylecode
 * @param   integer       MerchantId    Merchant Id
 *
 * @return  Object        resutl        Paging Object {HitsTotal,PageTotal,PageSize,PageCurrent,PageData}
 *
 *
 */
Factory.getProductLike = Q.async(function*(tr, Bale) {
    Bale.MerchantId = parseInt(Bale.MerchantId);
    var result = {
        HitsTotal: 0,
        PageTotal: 0,
        PageSize: Bale.Size,
        PageCurrent: 1,
        PageData: []
    };

    var condition = ` FROM 
            User U INNER JOIN Cart C On C.UserId = U.UserId
            INNER JOIN CartItem CI ON CI.CartId = C.CartId
            INNER JOIN Sku S ON S.SkuId = CI.SkuId
        WHERE 
            C.CartTypeId = 2 
            AND C.StatusId =2
            AND S.StyleCode = :StyleCode
            AND S.MerchantId = :MerchantId`
    var countSql = `SELECT COUNT(*) Total ${condition}`;
    var total = (yield tr.queryOne(countSql, Bale)).Total;

    if (total > 0) {
        var skip = (Bale.Page - 1) * Bale.Size;
        let sql = `
        SELECT 
            U.UserName,U.UserKey,U.DisplayName,U.ProfileImage
        ${condition}
        LIMIT ${skip},${Bale.Size}
    `;
        var data = yield tr.queryMany(sql, Bale);
        result.HitsTotal = total;
        result.PageTotal = Math.ceil(total / Bale.Size);
        result.PageData = data;
        result.PageCurrent = Bale.Page;
    }

    return result;
});

Factory.findDuplicatedSku = function(skuList, uniqueFields){
    var duplicatedSkuMap = {};
    var uniqueFields = cu.hasChild(uniqueFields) ? uniqueFields : ['SkuCode', 'Barcode'];

    uniqueFields.forEach(function(uniqueField){
        duplicatedSkuMap[uniqueField] = [];
        var groupByUniqueFieldSkuMap = _.groupBy(skuList, uniqueField);

        for (var key in groupByUniqueFieldSkuMap) {
            var count = groupByUniqueFieldSkuMap[key].length;

            //duplicated
            if(count > 1) {
                duplicatedSkuMap[uniqueField].push(key);
            }     
        }
    });

    return duplicatedSkuMap;
};

Factory.cleanUpStyleForAC = function(style){
    if(!style) return;

    //Style
    style = _.omit(style, [
        'SkuName', 'SkuDesc', 'SkuSizeComment', 'MerchantStatusId', 'MerchantNameInvariant', 'MerchantName', 'IsCrossBorder', 'BrandStatusId', 'BrandNameInvariant', 'BrandHeaderLogoImage', 'BrandSmallLogoImage', 'SkuDescInvariant', 'SkuSizeCommentInvariant',
        'StatusName', 'StatusNameInvariant', 'SeasonName', 'SeasonNameInvariant', 'BadgeName', 'BadgeImage', 'BadgeCode', 'BadgeNameInvariant', 'BrandImage', 'GeoCountryName', 'GeoCountryNameInvariant', 'IsDefault', 'StyleKey', 'IsNew', 'IsSale', 
        'PriceSort', 'TotalLocationCount', 'QtyAts', 'LastCreated', 'LastModified'
    ]);

    //SkuCulture    
    var skuDefault = _.find(style.SkuList, function(sku) { return sku.IsDefault === 1; });    
    if(skuDefault && skuDefault.SkuCulture){
        style.SkuCulture = _.clone(skuDefault.SkuCulture);
    }
    else{
        style.SkuCulture = _.clone(style.SkuList[0].SkuCulture);
    }    
    for(var cultureCode in style.SkuCulture){
        style.SkuCulture[cultureCode] = _.omit(style.SkuCulture[cultureCode], ['SkuColor']);
    }

    //SkuList
    style.SkuList = _.map(style.SkuList, function(sku){
        for(var cultureCode in sku.SkuCulture){
            sku.SkuCulture[cultureCode] = _.omit(sku.SkuCulture[cultureCode], ['SkuName', 'SkuDesc', 'SkuSizeComment']);
        }

        return _.omit(sku, [
            'StyleCode', 'BrandId', 'BadgeId', 'SeasonId', 'GeoCountryId', 'LaunchYear', 'LastModified', 'LastCreated', 'MerchantId', 'SizeGroupId', 'SizeGroupCode',
            'SizeGroupName', 'ColorImage', 'ColorName', 'SkuColor', 'SkuName', 'SkuNameInvariant', 'SkuSizeComment', 'SkuSizeCommentInvariant', 'IsNew', 'IsSale', 'PriceSort'
        ]);
    });

    //CategoryPriorityList
    style.CategoryPriorityList = _.map(style.CategoryPriorityList, function(category){
        return _.omit(category, ['CategoryCode', 'CategoryNameInvariant', 'CategoryImage', 'SizeGridImage', 'SizeGridImageInvariant', 'FeaturedImage', 'IsMale', 'IsFemale', 'DefaultCommissionRate', 'Level']);
    });

    //ColorImageList
    style.ColorImageList = _.map(style.ColorImageList, function(image){
        return _.omit(image, ['StyleImageId']);
    });

    //DescriptionImageList
    style.DescriptionImageList = _.map(style.DescriptionImageList, function(image){
        return _.omit(image, ['StyleImageId']);
    })

    //SizeList
    style.SizeList = _.map(style.SizeList, function(size){
        return _.omit(size, ['SizeName', 'SizeGroupCode', 'SizeGroupName']);
    });

    //ColorList
    style.ColorList = _.map(style.ColorList, function(color){
        return _.omit(color, ['ColorName', 'ColorImage'])
    });

    return style;
};

Factory.getSkuImportList = Q.async(function* (tr, Bale) {
    Bale.MerchantId = parseInt(Bale.MerchantId);
    var TotalSize = 0;
    var PageTotal = 0;
    var PageCurrent = parseInt(Bale.Page) - 1;
    var PageOffset = 0;
    var PageSize = parseInt(Bale.Size);
    var SkuImportList = [];
            
    // build where condition
    var strWhere = '';
    if (Bale.Guid) {
        strWhere = ` MerchantId=:MerchantId AND Guid=:Guid `;
    } else {
        strWhere = ` MerchantId=:MerchantId `;
    }

    // total rows
    var sqlQueryTotal = `
        SELECT COUNT(*) AS Total
        FROM SkuImport
        WHERE ${strWhere}
    `;
    TotalSize = (yield tr.queryOne(sqlQueryTotal, Bale)).Total;
    PageTotal = Math.ceil(TotalSize / PageSize);

    if (TotalSize <= PageSize) {
        PageOffset = 0;
        PageCurrent = 0;
    } else {
        PageOffset = parseInt(PageCurrent) * parseInt(PageSize);
    }
        
    // return data 
    var sqlQueryList = `
        SELECT  ImportId, MerchantId, Guid, Overwrite, FileLocation, ErrorLocation, ErrorCounts,
	            SkippedCounts, UpdateCounts, InsertCounts, TotalCounts,
                StatusId, LastCreated, LastModified
        FROM SkuImport
        WHERE ${strWhere}
        ORDER BY LastModified DESC
        LIMIT :Offset, :Limit
    `;
    SkuImportList = yield tr.queryMany(sqlQueryList, {
        MerchantId: Bale.MerchantId,
        Guid: Bale.Guid,
        Offset: PageOffset,
        Limit: PageSize
    });

    var Result = {
        HitsTotal: TotalSize,
        PageTotal: parseInt(PageTotal),
        PageSize: parseInt(PageSize),
        PageCurrent: parseInt(PageCurrent) + 1,
        PageData: SkuImportList
    };
    return Result;    
});

module.exports = Factory;
