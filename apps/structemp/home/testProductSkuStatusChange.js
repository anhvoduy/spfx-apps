'use strict';

// library requires
let util = require('util');

// local requires
let CONSTANTS = require('../logic/constants');
let authUtil = require('./util/authUtil');
let debugUtil = require('./util/debugUtil');
let productUtil = require('./util/productUtil');
let requestUtil = require('./util/requestUtil');
let brandUtil = require('./util/brandUtil');
let merchUtil = require('./util/merchUtil');
let cm = require('../lib/commonmariasql');

// global variables
let mApi = '/api/product/sku/status/change';
let mApiProductImageUpload = `/api/productimage/upload`;
let mApiProductSkuSave = `/api/product/sku/save`;
let mApiProductSkuView = `/api/product/sku/view`;
let mApiProductStyleUpdate = `/api/product/style/update`;
let mBrandId;
let mCredential;
let mMerchantId;
let mCategoryId = 105;
let mSkuId;
let mSkuCode = 'TEST-SkuCode';
let mStyleCode = 'TEST-StyleCode';
let mColorKey = 'TEST-ColorKey';
let mColorStyleImageId;
let mDescStyleImageId;
let mStatusList;
let skuIdWillRemove = [];

describe(util.format('Product.POST %s', mApi), function () {
    before(Q.async(function* () {
        let res = yield authUtil.login();
        debugUtil.r(res);
        mCredential = res.body;                
        
        try
        {   
            res = yield requestUtil.get('/api/reference/general', { cc: 'CHS' });
            debugUtil.r(res.body.StatusList);
            mStatusList = res.body.StatusList;
        }
        catch(e) {
            debugUtil.d(e);
        };
    }));

    beforeEach(Q.async(function* () {
        let res = yield brandUtil.create(mCredential.Token);
		debugUtil.r(res);
		mBrandId = res.body.BrandId;
	
		res = yield merchUtil.create(mCredential.Token, mBrandId);
		debugUtil.r(res);
		mMerchantId = res.body.EntityId;
	
		res = yield merchUtil.activate(mCredential.Token, mMerchantId);
        debugUtil.r(res);

        res = yield productUtil.create(mCredential.Token, mBrandId, mMerchantId);
        debugUtil.r(res);
        //console.log(res.body);
        mSkuId = res.body.EntityId;


        // upload image DESC
        res = yield requestUtil.post(mApiProductImageUpload, {}, mCredential.Token)
        .attach('file', __dirname + '/data/media/TEST-StyleCode_DESC_1.jpg')
        .field('data', JSON.stringify({
            MerchantId: mMerchantId
        }));
        debugUtil.r(res);
        expect(res.status, 'Status').eql(200);
        mDescStyleImageId = res.body.EntityId;

        // update imagekey DESC
        res = yield requestUtil.post(mApiProductStyleUpdate, {
            MerchantId: mMerchantId,
            style: {
                BrandId: mBrandId,
                CategoryPriorityList: [{
                    CategoryId: mCategoryId
                }],				
                DescriptionImageList: [
                    { ImageKey: mDescStyleImageId, Position: 1}
                ],
                ColorImageListMap: {},
                PriceRetail: 10.00,
                SkuList: [
                    {
                        ColorCode: 'NoColor',
                        ColorKey: 'TEST-ColorKey-EN',
                        IsDefault: 1,
                        PriceRetail: 10.00,
                        PriceSale: 8.00,
                        SizeCode: 'XXL',
                        SizeGroupCode: 'GENERIC',
                        SkuCode: mSkuCode,
                        SkuId: mSkuId,
                        SkuCulture: {
                            CHS: { SkuColor: 'TEST-ColorKey-CHS' },
                            CHT: { SkuColor: 'TEST-ColorKey-CHT' },
                            EN: { SkuColor: 'TEST-ColorKey-EN' }
                        },
                        StatusId: CONSTANTS.STATUS.PENDING
                    }
                ],
                StyleCode: mStyleCode,
                SkuCulture: {
                    CHS: { SkuName: 'TEST-SkuName-CHS' },
                    CHT: { SkuName: 'TEST-SkuName-CHT' },
                    EN: { SkuName: 'TEST-SkuName-EN' }
                }
            },
            deleteSkuIdList: [],
            isStyleCodeChanged: false,
            isImageChanged: true
        }, mCredential.Token);
        debugUtil.r(res);
        expect(res.status, 'Status').eql(200);

        // upload image COLOR
		res = yield requestUtil.post(mApiProductImageUpload, {}, mCredential.Token)
        .attach('file', __dirname + '/data/media/TEST-StyleCode_DESC_1.jpg')
        .field('data', JSON.stringify({
			MerchantId: mMerchantId
        }));
      	debugUtil.r(res);
		expect(res.status, 'Status').eql(200);
        mColorStyleImageId = res.body.EntityId;
        
        // update imagekey COLOR
		res = yield requestUtil.post(mApiProductStyleUpdate, {
			MerchantId: mMerchantId,
			style: {
				BrandId: mBrandId,
				CategoryPriorityList: [{
					CategoryId: mCategoryId
				}],				
				DescriptionImageList: [
					{ ImageKey: mDescStyleImageId, Position: 1}
				],
				ColorImageListMap: {
					'TEST-ColorKey-EN': [
						{ ColorKey: 'TEST-ColorKey-EN', ImageKey: mColorStyleImageId, Position: 1}
					]
				},
				PriceRetail: 10.00,
				SkuList: [
					{
						ColorCode: 'NoColor',
						ColorKey: 'TEST-ColorKey-EN',
						IsDefault: 1,
						PriceRetail: 10.00,
						PriceSale: 8.00,
						SizeCode: 'XXL',
						SizeGroupCode: 'GENERIC',
						SkuCode: mSkuCode,
						SkuId: mSkuId,
						SkuCulture: {
							CHS: { SkuColor: 'TEST-ColorKey-CHS' },
							CHT: { SkuColor: 'TEST-ColorKey-CHT' },
							EN: { SkuColor: 'TEST-ColorKey-EN' }
						},
						StatusId: CONSTANTS.STATUS.PENDING
					}
				],
				StyleCode: mStyleCode,
				SkuCulture: {
					CHS: { SkuName: 'TEST-SkuName-CHS' },
					CHT: { SkuName: 'TEST-SkuName-CHT' },
					EN: { SkuName: 'TEST-SkuName-EN' }
				}
			},
			deleteSkuIdList: [],
			isStyleCodeChanged: false,
			isImageChanged: true
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status, 'Status').eql(200);
    }));

    afterEach(Q.async(function* () {
        yield brandUtil.remove(mBrandId);
		yield merchUtil.remove(mMerchantId);
        yield productUtil.removeByStyleCode(mStyleCode);
        
        skuIdWillRemove.push(mSkuId);
        var arr = [];
        for (let i = 0; i < skuIdWillRemove.length; i++) {
            arr.push(productUtil.remove(mSkuId));
        }
        return Promise.all(arr);
    }));

    describe('@BVT', function () {
        [{
            Status: 'Active'
        }, {
            Status: 'Inactive'
        }].forEach(function (body) {
            it(util.format('should pass with valid Status:%s', body.Status), function () {
                body.MerchantId = mMerchantId;
                body.SkuId = mSkuId;

                return requestUtil.post(mApi, body, mCredential.Token)
                    .then(function (res) {
                        debugUtil.r(res);                        
                        expect(res.status).eql(200);
                        expect(res.body).all.keys('EntityId', 'Message', 'Success');
                        expect(res.body.EntityId).a('number');
                        expect(res.body.Message).match(new RegExp(body.Status));
                        expect(res.body.Success).eql(true);

                        return requestUtil.get('/api/product/sku/view', {
                            cc: 'CHS',
                            merchantid: mMerchantId,
                            skuid: mSkuId,
                        }, mCredential.Token);
                    })
                    .then(function (res) {
                        debugUtil.r(res);

                        if (body.Status === 'Deleted')
                            expect(res.status).eql(500);
                        else {
                            expect(res.status).eql(200);

                            let expectedStatus = _.find(mStatusList, function (o) {
                                return o.StatusNameInvariant === body.Status;
                            });

                            expect(res.body.StatusId).eql(expectedStatus.StatusId);
                        }
                    });
            });
        });

        [{
            describe: 'should fail without Authorization'
        }, {
            describe: 'should fail with invalid Authorization',
            token: 'INVALIDTOKEN'
        }].forEach(function (test) {
            it(test.describe, function () {
                return requestUtil.post(mApi, {}, test.token)
                    .then(function (res) {
                        debugUtil.r(res);
                        expect(res.status).eql(401);
                        expect(res.body.AppCode).eql('MSG_ERR_USER_UNAUTHORIZED');
                    });
            });
        });

        it('should fail without data', function () {
            return requestUtil.post(mApi, {}, mCredential.Token)
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_REQUIRED_FIELD_MISSING');
                });
        });

        it('should fail without SkuCode/SkuId', function () {
            return requestUtil.post(mApi, {
                MerchantId: mMerchantId,
                Status: 'Active'
            }, mCredential.Token)
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_REQUIRED_FIELD_MISSING');
                });
        });

        it('should fail with invalid SkuId:-1', function () {
            return requestUtil.post(mApi, {
                MerchantId: mMerchantId,
                SkuId: -1,
                Status: 'Active'
            }, mCredential.Token)
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_INVALID_FIELD');
                });
        });

        it('should fail with unfound SkuId:9999999999', function () {
            return requestUtil.post(mApi, {
                MerchantId: mMerchantId,
                SkuId: 9999999999,
                Status: 'Active'
            }, mCredential.Token)
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_SKU_NOT_FOUND');
                });
        });

        it('should fail without Status', function () {
            return requestUtil.post(mApi, {
                    MerchantId: mMerchantId,
                    SkuId: mSkuId
                },
                mCredential.Token
            )
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_SKU_STATUS_UNKNOWN');
                });
        });

        it('should fail with invalid Status:INVALIDSTATUS', function () {
            return requestUtil.post(mApi, {
                MerchantId: mMerchantId,
                SkuId: mSkuId,
                Status: 'INVALIDSTATUS'
            }, mCredential.Token)
                .then(function (res) {
                    debugUtil.r(res);
                    expect(res.status).eql(500);
                    expect(res.body.AppCode).eql('MSG_ERR_SKU_STATUS_UNKNOWN');
                });
        });
    });

    describe('@DEV', function () {
        it('@DEV should Failed when colorId = 0', Q.async(function *() {

            var tr = new cm();
            yield tr.begin();
            yield tr.queryExecute(`UPDATE Sku Set ColorId = 0 WHERE SkuId = ${mSkuId}`);
            yield tr.commit();

            var res1 = yield requestUtil.post(mApi, {
                SkuId: mSkuId,
                MerchantId: 1,
                SkuCode: 'TEST-SkuCode',
                Barcode: "Test Barcode",
                Status: 'Active'
            }, mCredential.Token)

            debugUtil.r(res1);

            expect(res1.status).eql(500);
            expect(res1.body.AppCode).eql('MSG_ERR_COLOR_OR_SIZE_INVALID');
        }));

        it('@DEV should Failed when SizeId = 0', Q.async(function *() {
            var tr = new cm();
            yield tr.begin();
            yield tr.queryExecute(`UPDATE Sku Set SizeId = 0 WHERE SkuId = ${mSkuId}`);
            yield tr.commit();

            var res1 = yield requestUtil.post(mApi, {
                SkuId: mSkuId,
                MerchantId: 1,
                SkuCode: 'TEST-SkuCode',
                Barcode: "Test Barcode",
                Status: 'Active'
            }, mCredential.Token)

            debugUtil.r(res1);

            expect(res1.status).eql(500);
            expect(res1.body.AppCode).eql('MSG_ERR_COLOR_OR_SIZE_INVALID');

        }));

        it('@DEV should Failed when Status="Deleted"', Q.async(function *() {

            var res1 = yield requestUtil.post(mApi, {
                SkuId: mSkuId,
                MerchantId: 1,
                SkuCode: 'TEST-SkuCode',
                Barcode: "Test Barcode",
                Status: 'Deleted'
            }, mCredential.Token)

            debugUtil.r(res1);

            expect(res1.status).eql(500);
            expect(res1.body.AppCode).eql('MSG_ERR_SKU_STATUS_UNKNOWN');

        }));

    });
});


describe(util.format('Product.POST %s', mApi), function(){	
	before(Q.async(function* () {
		let res = yield authUtil.login();
		debugUtil.r(res);
		mCredential = res.body;

		res = yield brandUtil.create(mCredential.Token);
		debugUtil.r(res);
		mBrandId = res.body.BrandId;
	
		res = yield merchUtil.create(mCredential.Token, mBrandId);
		debugUtil.r(res);
		mMerchantId = res.body.EntityId;
	
		res = yield merchUtil.activate(mCredential.Token, mMerchantId);
		debugUtil.r(res);

		res = yield requestUtil.post(mApiProductSkuSave, {
			SkuCode: mSkuCode,
			BrandId: mBrandId,
			CategoryId: mCategoryId,
			ColorId: 1,
			IsDefault: 1,
			MerchantId: mMerchantId,
			RetailPrice: 567,
			PriceRetail: 567,
			PriceSale: 234,
			SizeId: 1,			
			'SkuName-CHS': 'TEST-SkuName-CHS',
			'ColorName-CHS': 'TEST-ColorName-CHS',
			StyleCode: mStyleCode,
		}, mCredential.Token);
		debugUtil.r(res);
		mSkuId = res.body.EntityId;
	}));

	after(Q.async(function* () {
		yield brandUtil.remove(mBrandId);
		yield merchUtil.remove(mMerchantId);
		yield productUtil.removeByStyleCode(mStyleCode);
	}));
	
	it(`should failed with case: MSG_ERR_MISSING_DESC_IMAGE`, Q.async(function*(){
		let res = yield requestUtil.post(mApi, {
			MerchantId: mMerchantId,
			SkuId: mSkuId,
			Status: 'Active'
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status).eql(500);
		expect(res.body.AppCode,'AppCode').eql('MSG_ERR_MISSING_DESC_IMAGE');
	}));

	it(`should upload/update product image DESC success`, Q.async(function*(){
		// upload image DESC
		let res = yield requestUtil.post(mApiProductImageUpload, {}, mCredential.Token)
        .attach('file', __dirname + '/data/media/TEST-StyleCode_DESC_1.jpg')
        .field('data', JSON.stringify({
			MerchantId: mMerchantId
        }));
      	debugUtil.r(res);
		expect(res.status, 'Status').eql(200);
		mDescStyleImageId = res.body.EntityId;
	
		// update imagekey DESC
		res = yield requestUtil.post(mApiProductStyleUpdate, {
			MerchantId: mMerchantId,
			style: {
				BrandId: mBrandId,
				CategoryPriorityList: [{
					CategoryId: mCategoryId
				}],				
				DescriptionImageList: [
					{ ImageKey: mDescStyleImageId, Position: 1}
				],
				ColorImageListMap: {},
				PriceRetail: 10.00,
				SkuList: [
					{
						ColorCode: 'NoColor',
						ColorKey: 'TEST-ColorKey-EN',
						IsDefault: 1,
						PriceRetail: 10.00,
						PriceSale: 8.00,
						SizeCode: 'XXL',
						SizeGroupCode: 'GENERIC',
						SkuCode: mSkuCode,
						SkuId: mSkuId,
						SkuCulture: {
							CHS: { SkuColor: 'TEST-ColorKey-CHS' },
							CHT: { SkuColor: 'TEST-ColorKey-CHT' },
							EN: { SkuColor: 'TEST-ColorKey-EN' }
						},
						StatusId: CONSTANTS.STATUS.PENDING
					}
				],
				StyleCode: mStyleCode,
				SkuCulture: {
					CHS: { SkuName: 'TEST-SkuName-CHS' },
					CHT: { SkuName: 'TEST-SkuName-CHT' },
					EN: { SkuName: 'TEST-SkuName-EN' }
				}
			},
			deleteSkuIdList: [],
			isStyleCodeChanged: false,
			isImageChanged: true
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status, 'Status').eql(200);		
	}));

	it(`should failed with case: MSG_ERR_MISSING_COLOR_IMAGE`, Q.async(function*(){
		let res = yield requestUtil.post(mApi, {
			MerchantId: mMerchantId,
			SkuId: mSkuId,
			Status: 'Active'
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status).eql(500);
		expect(res.body.AppCode,'AppCode').eql('MSG_ERR_MISSING_COLOR_IMAGE');
	}));

	it(`should upload/update product image COLOR success`, Q.async(function*(){
		// upload image COLOR
		let res = yield requestUtil.post(mApiProductImageUpload, {}, mCredential.Token)
        .attach('file', __dirname + '/data/media/TEST-StyleCode_DESC_1.jpg')
        .field('data', JSON.stringify({
			MerchantId: mMerchantId
        }));
      	debugUtil.r(res);
		expect(res.status, 'Status').eql(200);
		mColorStyleImageId = res.body.EntityId;		
	
		// update imagekey COLOR
		res = yield requestUtil.post(mApiProductStyleUpdate, {
			MerchantId: mMerchantId,
			style: {
				BrandId: mBrandId,
				CategoryPriorityList: [{
					CategoryId: mCategoryId
				}],				
				DescriptionImageList: [
					{ ImageKey: mDescStyleImageId, Position: 1}
				],
				ColorImageListMap: {
					'TEST-ColorKey-EN': [
						{ ColorKey: 'TEST-ColorKey-EN', ImageKey: mColorStyleImageId, Position: 1}
					]
				},
				PriceRetail: 10.00,
				SkuList: [
					{
						ColorCode: 'NoColor',
						ColorKey: 'TEST-ColorKey-EN',
						IsDefault: 1,
						PriceRetail: 10.00,
						PriceSale: 8.00,
						SizeCode: 'XXL',
						SizeGroupCode: 'GENERIC',
						SkuCode: mSkuCode,
						SkuId: mSkuId,
						SkuCulture: {
							CHS: { SkuColor: 'TEST-ColorKey-CHS' },
							CHT: { SkuColor: 'TEST-ColorKey-CHT' },
							EN: { SkuColor: 'TEST-ColorKey-EN' }
						},
						StatusId: CONSTANTS.STATUS.PENDING
					}
				],
				StyleCode: mStyleCode,
				SkuCulture: {
					CHS: { SkuName: 'TEST-SkuName-CHS' },
					CHT: { SkuName: 'TEST-SkuName-CHT' },
					EN: { SkuName: 'TEST-SkuName-EN' }
				}
			},
			deleteSkuIdList: [],
			isStyleCodeChanged: false,
			isImageChanged: true
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status, 'Status').eql(200);		
	}));

	it(`should pass with status ${CONSTANTS.STATUS.ACTIVE}`, Q.async(function*(){
		let res = yield requestUtil.post(mApi, {
			MerchantId: mMerchantId,
			SkuId: mSkuId,
			Status: 'Active'
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status).eql(200);
	}));

	it(`should view sku with status ${CONSTANTS.STATUS.ACTIVE}`, Q.async(function*(){
		let res = yield requestUtil.get(mApiProductSkuView, {
			cc: 'CHS',
			merchantid: mMerchantId,
			skucode: mSkuCode
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status, 'Status').eql(200);
		expect(res.body.SkuId, 'SkuId').a('number');
		expect(res.body.SkuId, 'SkuId').eql(mSkuId);
		expect(res.body.StatusId, 'StatusId').a('number');
		expect(res.body.StatusId, 'StatusId').eql(CONSTANTS.STATUS.ACTIVE);
	}));
});
