'use strict';

// library requires
let util = require('util');

let dataSetup = require('./testDataSetup');

// local requires
let CONSTANTS = require('../logic/constants');
let authUtil = require('./util/authUtil');
let debugUtil = require('./util/debugUtil');

let requestUtil = require('./util/requestUtil');
let brandUtil = require('./util/brandUtil');
let merchUtil = require('./util/merchUtil');
let productUtil = require('./util/productUtil');

// global APIs
let mActivateApi = '/api/product/sku/activate/all';
let mGetApi = '/api/product/sku/list';
let mApiProductImageUpload = `/api/productimage/upload`;
let mApiProductSkuSave = `/api/product/sku/save`;
let mApiProductSkuView = `/api/product/sku/view`;
let mApiProductSkuStatusChange = `/api/product/sku/status/change`;
let mApiProductStyleUpdate = `/api/product/style/update`;

// global variables
let mCredential;
let mSkus = [];
let mBrandId;
let mMerchantId;
let mCategoryId = 105;
let mDescStyleImageId;
let mColorStyleImageId;
let mSku;
let mSkuId;
let mSkuCode = 'TEST-SkuCode';
let mStyleCode = 'TEST-StyleCode';
let mColorKey = 'TEST-ColorKey';

describe(util.format('Product.POST %s', mApiProductSkuStatusChange), function(){	
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

		res = yield requestUtil.post(mApiProductStyleCreate, {
			MerchantId: mMerchantId,
			style: {
				BrandId: mBrandId,
				CategoryPriorityList: [{ CategoryId: mCategoryId }],
				ColorImageListMap: {
					'TEST-ColorKey-EN': [
						{ ColorKey: 'TEST-ColorKey-EN', ImageKey: 'TEST-ImageKey', Position: 1 }
					]
				  },
				DescriptionImageList: [
						{ ImageKey: 'TEST-ImageKey', Position: 1 }
				],
				PriceRetail: 10.00,
				SkuList: [{
					ColorCode: 'NoColor',
					ColorKey: 'TEST-ColorKey-EN',
					IsDefault: 1,
					SizeCode: 'XXL',
					PriceRetail: 567,
					PriceSale: 234,
					SaleFrom: null,
					SaleTo: null,
					SizeGroupCode: 'GENERIC',
					SkuCode: mSkuCode,
					SkuCulture: {
						CHS: { SkuColor: 'TEST-ColorKey-CHS' },
						CHT: { SkuColor: 'TEST-ColorKey-CHT' },
						  EN: { SkuColor: 'TEST-ColorKey-EN' }
					}
				}],
				StyleCode: mStyleCode,
				SkuCulture: {
					CHS: { SkuName: 'TEST-SkuName-CHS' },
					CHT: { SkuName: 'TEST-SkuName-CHT' },
					EN: { SkuName: 'TEST-SkuName-EN' }
				}
			}
		}, mCredential.Token);
		debugUtil.r(res);

		res = yield requestUtil.get(mApiProductSkuView, {
			cc: 'CHS',
			merchantid: mMerchantId,
			skucode: mSkuCode
		}, mCredential.Token);
		debugUtil.r(res);
		mSkuId = res.body.SkuId;
	}));

	after(Q.async(function* () {
		yield brandUtil.remove(mBrandId);
		yield merchUtil.remove(mMerchantId);
		yield productUtil.removeByStyleCode(mStyleCode);
	}));
	
	it(`should pass with status ${CONSTANTS.STATUS.ACTIVE}`, Q.async(function*(){
		let res = yield requestUtil.post(mApiProductSkuStatusChange, {
			MerchantId: mMerchantId,
			SkuId: mSkuId,
			Status: 'Active'
		}, mCredential.Token);
		debugUtil.r(res);
		expect(res.status).eql(200);
	}));
});

describe(util.format('Product.POST %s', mApiProductSkuStatusChange), function(){	
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
		let res = yield requestUtil.post(mApiProductSkuStatusChange, {
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
		let res = yield requestUtil.post(mApiProductSkuStatusChange, {
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
		let res = yield requestUtil.post(mApiProductSkuStatusChange, {
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