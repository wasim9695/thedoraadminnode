const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');
const { SellerBrands } = require("../../models/s_seller_brands");
const { SellerCategories } = require("../../models/s_seller_categories");
const { Stores } = require("../../models/s_store");
const { EtdDetails } = require("../../models/s_etd");


const kycStages = [
    {
        "$lookup": {
            "from": "kycs",
            "let": {
                "sellerId": "$sellerId"
            },
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {
                                    "$eq": [
                                        "$isDeleted",
                                        false
                                    ]
                                },
                                {
                                    "$eq": [
                                        "$sellerId",
                                        "$$sellerId"
                                    ]
                                }
                            ]
                        }
                    }
                }
            ],
            "as": "kycDetails"
        }
    },
    { $unwind: { "path": "$kycDetails", "preserveNullAndEmptyArrays": true } },
]
const etdStages = [
    {
        "$lookup": {
            "from": "etds",
            "let": {
                "sellerId": "$sellerId"
            },
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {
                                    "$eq": [
                                        "$isDeleted",
                                        false
                                    ]
                                },
                                {
                                    "$eq": [
                                        "$sellerId",
                                        "$$sellerId"
                                    ]
                                }
                            ]
                        }
                    }
                }
            ],
            "as": "etdDetails"
        }
    },
    { $unwind: { "path": "$etdDetails", "preserveNullAndEmptyArrays": true } },
]

const approvedProductStages = [
    {
        $lookup: {
            from: "products",
            let: {
                sellerId: "$sellerId",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: ["$isDeleted", false],
                                },
                                {
                                    $eq: ["$status", "Approved"],
                                },
                                {
                                    $eq: ["$sellerId", "$$sellerId"],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "approvedProducts",
        },
    },
]

const pendingProductStages = [
    {
        $lookup: {
            from: "products",
            let: {
                sellerId: "$sellerId",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: ["$isDeleted", false],
                                },
                                {
                                    $eq: ["$status", "Pending"],
                                },
                                {
                                    $eq: ["$sellerId", "$$sellerId"],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "pendingProducts",
        },
    },
]

const sellerBrandsStages = [
    {
        $lookup: {
            from: "seller_brands",
            let: {
                sellerId: "$sellerId",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: ["$isDeleted", false],
                                },
                                {
                                    $eq: ["$sellerId", "$$sellerId"],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "sellerBrands",
        },
    },
]

const sellerCategoriesStages = [
    {
        $lookup: {
            from: "seller_categories",
            let: {
                sellerId: "$sellerId",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: ["$isDeleted", false],
                                },
                                {
                                    $eq: ["$sellerId", "$$sellerId"],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "sellerCategories",
        },
    },
]

const storesListingStages = [
    ...kycStages,
    ...etdStages,
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "business_segments", localField: "seller.segmentId", foreignField: "_id", as: "segment" } },
    { $unwind: { "path": "$segment", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "countries", localField: "storeAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
    ...approvedProductStages,
    ...pendingProductStages,
    ...sellerBrandsStages,
    ...sellerCategoriesStages,
    {
        $project: {
            _id: 1, createdAt: 1,
            sellerId: "$seller.registerId", sellerName: "$seller.fullName", mobileNo: "$seller.mobileNo", emailId: "$seller.emailId",
            subSegment: "$seller.subSegment", ownershipType: "$seller.ownershipType", sponserId: "$seller.sponserId",
            "segmentName": "$segment.name",
            storeName: "$name", storeBanner: "$storeLink", storeId: "$registerId", status: 1, approvalStatus: 1,
            "storeAddress.addressLine1": "$storeAddress.addressLine1",
            "storeAddress.addressLine2": "$storeAddress.addressLine2",
            "storeAddress.city": "$storeAddress.city",
            "storeAddress.cityId": "$storeAddress.cityId",
            "storeAddress.pincode": "$storeAddress.pincode",
            "storeAddress.countryName": "$country.name",
            "storeAddress.countryId": "$country.countryId",
            "storeAddress.state": "$storeAddress.state",
            "storeAddress.stateId": "$storeAddress.stateId",
            kycStatus: "$kycDetails.status", kycId: "$kycDetails._id", legalDetailsStatus: "$etdDetails.status",
            legalDetailsId: "$etdDetails._id",
            totalProductsApplied: { $size: "$approvedProducts" },
            totalProductsApproved: { $size: "$pendingProducts" },
            brandsCount: { $size: "$sellerBrands" },
            categoriesCount: { $size: "$sellerCategories" }
        }
    },
]
const lookupStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: { "path": "$category", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: { "path": "$subCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: { "path": "$childCategory", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brand" } },
    { $unwind: { "path": "$brand", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "seller" } },
    { $unwind: { "path": "$seller", "preserveNullAndEmptyArrays": true } },
    ...kycStages
]

const sellerBrandsListingStages = [
    ...lookupStages,
    {
        $project: {
            _id: 1, sellerId: "$seller.registerId", sellerName: "$seller.fullName", mobileNo: "$seller.mobileNo", emailId: "$seller.emailId",
            categoryId: 1, categoryName: "$category.categoryName", subCategoryId: 1, subCategoryName: "$subCategory.categoryName", childCategoryId: 1, childCategoryName: "$childCategory.categoryName",
            brandName: "$brand.name", brand: 1,
            createdAt: 1, registerId: 1, approvalStatus: 1, image: 1, status: 1
        }
    }
]

const sellerCategoriesListingStages = [
    ...lookupStages,
    {
        $project: {
            _id: 1, createdAt: 1, sellerId: "$seller.registerId", sellerName: "$seller.fullName", mobileNo: "$seller.mobileNo", emailId: "$seller.emailId",
            categoryId: 1, categoryName: "$category.categoryName", subCategoryId: 1, subCategoryName: "$subCategory.categoryName", childCategoryId: 1, childCategoryName: "$childCategory.categoryName",
            kycStatus: "$kycDetails.status", registerId: 1, image: 1, status: 1, approvalStatus: 1
        }
    }
]

class ManageApprovalsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
       Purpose: Update etd details by admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "status": "Rejected",
           "remarks": "Reason for rejection"
           "etdId":"",
       }               
       Return: JSON String
   ********************************************************/
    async updateEtdStatusByAdmin() {
        try {
            const data = this.req.body;
            const fieldsArray = data.status == "Rejected" ? ["status", "remarks", "etdId"] : ["status", "etdId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const etd = await EtdDetails.findOne({ _id: data.etdId, isDeleted: false });
            if (_.isEmpty(etd))
                return this.res.send({ status: 0, message: "Store details not found" });
            await EtdDetails.findByIdAndUpdate(data.etdId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Store details updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
        Purpose: Update store details by admin
        Method: Post
        Authorisation: true
        Parameter:
        {
            "approvalStatus": "Rejected",
            "remarks": "Reason for rejection"
            "storeId":"",
        }               
        Return: JSON String
    ********************************************************/
    async updateStoreStatusByAdmin() {
        try {
            const data = this.req.body;
            const fieldsArray = data.approvalStatus == "Rejected" ? ["approvalStatus", "remarks", "storeId"] : ["approvalStatus", "storeId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const store = await Stores.findOne({ _id: data.storeId, isDeleted: false });
            if (_.isEmpty(store))
                return this.res.send({ status: 0, message: "Store details not found" });
            await Stores.findByIdAndUpdate(data.storeId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Store details updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
  Purpose: stores Listing In Admin
  Method: Post
  Authorisation: true
  Parameter:
  {
      "page":1,
      "pagesize":3,
      "startDate":"2022-09-20",
      "endDate":"2022-09-25",
      "searchText": "",
  }
  Return: JSON String
  ********************************************************/
    async storesListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ sellerId: regex }, { sellerName: regex }, { mobileNo: regex }, { emailId: regex },
                    { storeName: regex }, { storeId: regex }, { approvalStatus: regex }]
                })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await Stores.aggregate([
                { $match: { isDeleted: false } },
                ...storesListingStages,
                { $match: { $and: query } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Stores.aggregate([
                { $match: { isDeleted: false } },
                ...storesListingStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
Purpose: Update seller brand details by admin
Method: Post
Authorisation: true
Parameter:
{
    "approvalStatus": "Rejected",
    "remarks": "Reason for rejection",
    "sellerBrandId":"634178472076c8d1af4452cd",
}               
Return: JSON String
********************************************************/
    async updateSellerBrandStatusByAdmin() {
        try {
            const data = this.req.body;
            const fieldsArray = data.approvalStatus == "Rejected" ? ["approvalStatus", "remarks", "sellerBrandId"] : ["approvalStatus", "sellerBrandId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const sellerBrand = await SellerBrands.findOne({ _id: data.sellerBrandId, isDeleted: false });
            if (_.isEmpty(sellerBrand))
                return this.res.send({ status: 0, message: "Seller brands details not found" });
            await SellerBrands.findByIdAndUpdate(data.sellerBrandId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Seller brands details updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose: sellerBrands Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2022-09-25",
        "searchText": ""
    }
    Return: JSON String
    ********************************************************/
    async sellerBrandsListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }, { subCategoryName: regex }, { childCategoryName: regex }, { approvalStatus: regex }, { sellerName: regex }, { sellerId: regex }, { brandName: regex }] })
            }
            const result = await SellerBrands.aggregate([
                { $match: { isDeleted: false } },
                ...sellerBrandsListingStages,
                { $match: { $and: query } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await SellerBrands.aggregate([
                { $match: { isDeleted: false } },
                ...sellerBrandsListingStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
    /********************************************************
    Purpose: Update seller categories details by admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "approvalStatus": "Rejected",
        "remarks": "Reason for rejection"
        "sellerCategoryId":"",
    }               
    Return: JSON String
    ********************************************************/
    async updateSellerCategoriesStatusByAdmin() {
        try {
            const data = this.req.body;
            const fieldsArray = data.approvalStatus == "Rejected" ? ["approvalStatus", "remarks", "sellerCategoryId"] : ["approvalStatus", "sellerCategoryId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const sellerCategory = await SellerCategories.findOne({ _id: data.sellerCategoryId, isDeleted: false });
            if (_.isEmpty(sellerCategory))
                return this.res.send({ status: 0, message: "Seller categories details not found" });
            await SellerCategories.findByIdAndUpdate(data.sellerCategoryId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Seller categories details updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
Purpose: sellerCategories Listing In Admin
Method: Post
Authorisation: true
Parameter:
{
   "page":1,
   "pagesize":3,
   "startDate":"2022-09-20",
   "endDate":"2022-09-25",
   "searchText": ""
}
Return: JSON String
********************************************************/
    async sellerCategoriesListing() {
        try {
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ categoryName: regex }, { subCategoryName: regex }, { childCategoryName: regex },
                    { approvalStatus: regex }, { sellerName: regex }, { sellerId: regex },]
                })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            const result = await SellerCategories.aggregate([
                { $match: { isDeleted: false } },
                ...sellerCategoriesListingStages,
                { $match: { $and: query } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await SellerCategories.aggregate([
                { $match: { isDeleted: false } },
                ...sellerCategoriesListingStages,
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = ManageApprovalsController;