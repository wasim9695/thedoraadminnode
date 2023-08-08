const _ = require("lodash");
const { ObjectID } = require('mongodb');

const Controller = require("../base");
const { Sellers } = require('../../models/s_sellers');
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const DownloadsController = require('../common/downloads');
const { AccessTokens } = require("../../models/s_auth");
const { Tickets } = require("../../models/s_ticket");
const { KycDetails } = require("../../models/s_kyc");

const kycStages = [
    {
        "$lookup": {
            "from": "kycs",
            "let": {
                "sellerId": "$_id"
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

const signatureStages = [
    {
        "$lookup": {
            "from": "signatures",
            "let": {
                "sellerId": "$_id"
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
            "as": "signatureDetails"
        }
    },
    { $unwind: { "path": "$signatureDetails", "preserveNullAndEmptyArrays": true } },
]

const etdStages = [
    {
        "$lookup": {
            "from": "etds",
            "let": {
                "sellerId": "$_id"
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

const fssaiStages = [
    {
        "$lookup": {
            "from": "fssais",
            "let": {
                "sellerId": "$_id"
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
            "as": "fssaiDetails"
        }
    },
    { $unwind: { "path": "$fssaiDetails", "preserveNullAndEmptyArrays": true } },
]

const iecStages = [
    {
        "$lookup": {
            "from": "iecs",
            "let": {
                "sellerId": "$_id"
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
            "as": "iecDetails"
        }
    },
    { $unwind: { "path": "$iecDetails", "preserveNullAndEmptyArrays": true } },
]

const bankStages = [
    {
        "$lookup": {
            "from": "bankdetails",
            "let": {
                "sellerId": "$_id"
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
            "as": "bankDetails"
        }
    },
    {
        "$unwind": {
            "path": "$bankDetails",
            "preserveNullAndEmptyArrays": true
        }
    },
]

const storeStages = [
    {
        "$lookup": {
            "from": "stores",
            "let": {
                "sellerId": "$_id"
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
            "as": "storeDetails"
        }
    },
    { $unwind: { "path": "$storeDetails", "preserveNullAndEmptyArrays": true } },
]

const segmentStages = [
    { $lookup: { from: "business_segments", localField: "segmentId", foreignField: "_id", as: "segment" } },
    { $unwind: { "path": "$segment", "preserveNullAndEmptyArrays": true } },
]

const subSegmentStages = [
    { $lookup: { from: "business_sub_segments", localField: "subSegmentId", foreignField: "_id", as: "subSegment" } },
    { $unwind: { "path": "$subSegment", "preserveNullAndEmptyArrays": true } },
]

const sellersListingStages = [
    ...kycStages,
    ...storeStages,
    ...segmentStages,
    ...subSegmentStages,
    { $lookup: { from: "countries", localField: "mailingAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            _id: 1, createdAt: 1, registerId: 1, fullName: 1, image: 1, sponserId: 1, age: 1, gender: 1, mobileNo: 1, emailId: 1, status: 1,
            kycDetails: 1, "mailingAddress.addressLine1": 1, "mailingAddress.addressLine2": 1,
            "mailingAddress.countryId": "$country", "mailingAddress.pincode": 1,
            "mailingAddress.city": 1, "mailingAddress.cityId": 1,
            "mailingAddress.state": 1, "mailingAddress.stateId": 1, storeDetails: 1, "segment.name": 1, "segment._id": 1,
            "subSegment.name": 1, "subSegment._id": 1, ownershipType: 1,
        }
    }
]

const downloadFilesStages = [
    ...kycStages,
    ...storeStages,
    ...segmentStages,
    ...subSegmentStages,
    { $lookup: { from: "countries", localField: "mailingAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
]

const downloadFilesStagesProjection = [
    {
        $project: {
            "Doj": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            "Seller ID": "$registerId",
            "Seller Name": "$fullName",
            "Seller Image": "$image",
            "Store Name": "$storeDetails.name",
            "Store ID": "$storeDetails.registerId",
            "Store Logo": "$storeDetails.logo",
            "Age": "$age",
            "Gender": "$gender",
            "Mobile Number": "$mobileNo",
            "Email ID": "$emailId",
            "Account Status": "$status",
            "KYC status": "$kycDetails.status",
            "Remarks": "$kycDetails.remarks",
            "Country": "$country.name",
            "State": "$mailingAddress.state",
            "City": "$mailingAddress.city",
            "Business Segment": "$segment.name",
            "Business Sub-Segment": "$subSegment.name",
            "Business Ownship Type": "$ownershipType",
            "Sponser ID": "$sponserId"
        }
    }
]

const getSellerStages = [
    ...kycStages,
    ...bankStages,
    ...storeStages,
    ...segmentStages,
    ...subSegmentStages,
    {
        "$lookup": {
            "from": "countries",
            "localField": "mailingAddress.countryId",
            "foreignField": "_id",
            "as": "mailingCountry"
        }
    },
    {
        "$unwind": {
            "path": "$mailingCountry",
            "preserveNullAndEmptyArrays": true
        }
    },
    { $lookup: { from: "countries", localField: "storeDetails.storeAddress.countryId", foreignField: "_id", as: "storeCountry" } },
    { $unwind: { "path": "$storeCountry", "preserveNullAndEmptyArrays": true } },
    {
        "$project": {
            "_id": 1,
            "fullName": 1,
            "dob": 1,
            "gender": 1,
            "age": 1,
            "emailId": 1,
            "mobileNo": 1,
            "registerId": 1,
            "termsAndConditions": 1,
            "status": 1,
            "mailingAddress.addressLine1": "$mailingAddress.addressLine1",
            "mailingAddress.addressLine2": "$mailingAddress.addressLine2",
            "mailingAddress.city": "$mailingAddress.city",
            "mailingAddress.cityId": "$mailingAddress.cityId",
            "mailingAddress.pincode": "$mailingAddress.pincode",
            "mailingAddress._id": "$mailingAddress._id",
            "mailingAddress.state": "$mailingAddress.state",
            "mailingAddress.stateId": "$mailingAddress.stateId",
            "mailingAddress.country.name": "$mailingCountry.name",
            "mailingAddress.country.iso": "$mailingCountry.iso",
            "mailingAddress.country.nickname": "$mailingCountry.nickname",
            "mailingAddress.country._id": "$mailingCountry._id",
            "mailingAddress.country.countryId": "$mailingCountry.countryId",
            "kycDetails": 1,
            "bankDetails": 1,
            "storeDetails": 1,
            "storeCountry.name": "$storeCountry.name",
            "storeCountry.iso": "$storeCountry.iso",
            "storeCountry.nickname": "$storeCountry.nickname",
            "storeCountry._id": "$storeCountry._id",
            "storeCountry.countryId": "$storeCountry.countryId",
            "sponserId": 1,
            "segment.name": 1,
            "segment._id": 1,
            "subSegment.name": 1,
            "subSegment._id": 1, ownershipType: 1,
        }
    },
    {
        "$group": {
            "_id": "$_id",
            "fullName": {
                "$first": "$fullName"
            },
            "dob": {
                "$first": "$dob"
            },
            "gender": {
                "$first": "$gender"
            },
            "age": {
                "$first": "$age"
            },
            "emailId": {
                "$first": "$emailId"
            },
            "country": {
                "$first": "$country"
            },
            "mobileNo": {
                "$first": "$mobileNo"
            },
            "registerId": {
                "$first": "$registerId"
            },
            "termsAndConditions": {
                "$first": "$termsAndConditions"
            },
            "status": {
                "$first": "$status"
            },
            "mailingAddress": {
                "$push": {
                    "addressLine1": "$mailingAddress.addressLine1",
                    "addressLine2": "$mailingAddress.addressLine2",
                    "city": "$mailingAddress.city",
                    "cityId": "$mailingAddress.cityId",
                    "state": "$mailingAddress.state",
                    "stateId": "$mailingAddress.stateId",
                    "pincode": "$mailingAddress.pincode",
                    "_id": "$mailingAddress._id",
                    "country": "$mailingAddress.country"
                }
            },
            "kycDetails": {
                "$first": "$kycDetails"
            },
            "bankDetails": {
                "$first": "$bankDetails"
            },
            "storeDetails": {
                "$first": "$storeDetails"
            },
            "sponserId": {
                "$first": "$sponserId"
            },
            "storeCountry": {
                "$first": "$storeCountry"
            },
            "segment": {
                "$first": "$segment"
            },
            "subSegment": {
                "$first": "$subSegment"
            },
            "ownershipType": {
                "$first": "$ownershipType"
            }
        }
    }
]

const kycSellersListingStages = [
    ...kycStages,
    ...etdStages,
    ...fssaiStages,
    ...iecStages,
    ...bankStages,
    ...storeStages,
    { $lookup: { from: "countries", localField: "mailingAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            _id: 1, createdAt: 1, registerId: 1, fullName: 1, status: 1, storeDetails: 1,
            kycDetails: 1, country: 1, bankDetails: 1, etdDetails: 1, fssaiDetails: 1, iecDetails: 1
        }
    }
]

const getKycDetailsStages = [
    ...kycStages,
    ...etdStages,
    ...fssaiStages,
    ...iecStages,
    ...bankStages,
    ...storeStages,
    { $lookup: { from: "countries", localField: "storeDetails.storeAddress.countryId", foreignField: "_id", as: "storeCountry" } },
    { $unwind: { "path": "$storeCountry", "preserveNullAndEmptyArrays": true } },
    {
        "$project": {
            "_id": 1,
            "fullName": 1,
            "createdAt": 1,
            "gender": 1,
            "age": 1,
            "emailId": 1,
            "mobileNo": 1,
            "kycDetails": 1,
            "bankDetails": 1,
            "etdDetails": 1,
            "fssaiDetails": 1,
            "iecDetails": 1,
            "storeDetails": 1,
            "storeCountry": 1
        }
    }
]

const downloadKycFilesStages = [
    ...kycStages,
    ...etdStages,
    ...fssaiStages,
    ...iecStages,
    ...bankStages,
    ...signatureStages,
    ...storeStages,
    { $lookup: { from: "countries", localField: "mailingAddress.countryId", foreignField: "_id", as: "country" } },
    { $unwind: { "path": "$country", "preserveNullAndEmptyArrays": true } },
]

const downloadKycFilesStagesProjection = [
    {
        $project: {
            "Doj": { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            "Seller ID": "$registerId",
            "Seller Name": "$fullName",
            "Seller Image": "$image",
            "Store Name": "$storeDetails.name",
            "Store ID": "$storeDetails.registerId",
            "Store Logo": "$storeDetails.logo",
            "KYC Doc No": "$kycDetails.numberProof",
            "KYC Front Image": "$kycDetails.frontImage",
            "KYC Back Image": "$kycDetails.backImage",
            "KYC Status": "$kycDetails.status",
            "KYC Remarks": "$kycDetails.remarks",
            "Country": "$country.name",
            "Bank Name": "$bankDetails.bankName",
            "Account No": "$bankDetails.accountNumber",
            "Account Type": "$bankDetails.accountType",
            "IFSC Code": "$bankDetails.IFSCCode",
            "IBAN Number": "$bankDetails.IBANNumber",
            "Swift Code": "$bankDetails.swiftCode",
            "Branch Name": "$bankDetails.branchName",
            "Bank Statement": "$bankDetails.bankStatement",
            "IEC Number": "$iecDetails.iecLicenseNo",
            "IEC Image": "$iecDetails.iecLicenseDoc",
            "FSSAI No": "$fssaiDetails.licenseNo",
            "FSSAI Doc Image": "$fssaiDetails.licenseDoc",
            "Legal Name": "$etdDetails.name",
            "GST No": "$etdDetails.gstNo",
            "GST Image": "$etdDetails.gstImage",
            "Pan Image": "$etdDetails.panImage",
            "Pan No": "$etdDetails.panNo",
            "Signature": "$signatureDetails.uploadSignature"
        }
    }
]

const loginHistoryStages = [
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "sellers" } },
    { $unwind: { "path": "$sellers", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "stores", localField: "sellerId", foreignField: "sellerId", as: "stores" } },
    { $unwind: { "path": "$stores", "preserveNullAndEmptyArrays": true } },
    {
        $project: {
            "sellers.fullName": "$sellers.fullName",
            "sellers.registerId": "$sellers.registerId",
            "sellers._id": "$sellers._id",
            "sellers.status": "$sellers.status",
            "stores.name": "$stores.name",
            "stores.registerId": "$stores.registerId",
            ipAddress: 1,
            device: 1,
            createdAt: 1,
            updatedAt: 1
        }
    }
]

const downloadFilesOfLoginHistory = [
    { $lookup: { from: "sellers", localField: "sellerId", foreignField: "_id", as: "sellers" } },
    { $unwind: { "path": "$sellers", "preserveNullAndEmptyArrays": true } },
    { $lookup: { from: "stores", localField: "sellerId", foreignField: "sellerId", as: "stores" } },
    { $unwind: { "path": "$stores", "preserveNullAndEmptyArrays": true } },
]

const downloadFilesOfLoginHistoryProjection = [
    {
        $project: {
            "Seller Name": "$sellers.fullName",
            "Seller ID": "$sellers.registerId",
            "Store Name": "$stores.name",
            "Store ID": "$stores.registerId",
            Status: "$sellers.status",
            "IP Address": "$ipAddress",
            Device: "$device",
            "Logged In Time": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createdAt", timezone: "Asia/Kolkata" } },
            "Logged Out Time": { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$updatedAt", timezone: "Asia/Kolkata" } }
        }
    }
]

class SellerManagementController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: sellers Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2022-09-25",
        "filter": {
            "status": true,
            "kycDetails.status": "Approved",
            "mailingAddress.countryId.name":"India"
        },
        "searchText": ""
    }
    Return: JSON String
    ********************************************************/
    async sellersListing() {
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
                query.push({ $or: [{ fullName: regex }, { registerId: regex }, { mobileNo: regex }, { emailId: regex }] })
            }
            const filterQuery = data.filter ? data.filter : {};
            const result = await Sellers.aggregate([
                { $match: { isDeleted: false } },
                ...sellersListingStages,
                { $match: { $and: query } },
                { $match: filterQuery },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Sellers.aggregate([
                { $match: { isDeleted: false } },
                ...sellersListingStages,
                { $match: { $and: query } },
                { $match: filterQuery },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
        Purpose: Get Seller Details
        Method: GET
        Authorisation: true
        Return: JSON String
        ********************************************************/
    async getSellerDetails() {
        try {
            const sellerId = this.req.params.sellerId;
            if (!sellerId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const tickets = await Tickets.find({ isDeleted: false, sellerId: sellerId });
            const getSeller = await Sellers.aggregate([
                { $match: { _id: ObjectID(sellerId), isDeleted: false } },
                ...getSellerStages
            ])
            if (_.isEmpty(getSeller) && getSeller.length == 0)
                return this.res.send({ status: 0, message: "Seller details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: { sellerDetails: getSeller[0], tickets, } });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: Delete Single And Multiple Sellers Details In Admin
       Method: Post
       Authorisation: true
       Parameter:
       {
           "sellerIds":["5cd01da1371dc7190b085f86"]
       }
       Return: JSON String
       ********************************************************/
    async deleteSellers() {
        try {
            if (!this.req.body.sellerIds) {
                return this.res.send({ status: 0, message: "Please send sellerIds" });
            }
            let msg = 'Seller not deleted.';
            let status = 1;
            const updatedSellers = await Sellers.updateMany({ _id: { $in: this.req.body.sellerIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedSellers) {
                msg = updatedSellers.modifiedCount ? updatedSellers.modifiedCount + ' seller deleted.' : updatedSellers.matchedCount == 0 ? "Details not found" : msg;
                status = updatedSellers.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: Download csv and excel files
       Method: Post
       Authorisation: true
       Parameter:
       {
            "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "filter": {
                "status": true,
                "kycDetails.status": "Approved",
                "country.name":"India"
            },
            "searchText": "",
            "filteredFields": ["Doj", "Seller ID"] 
        }
       Return: JSON String
       ********************************************************/
    async downloadSellerFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Doj", "Seller ID", "Seller Name", "Seller Image", "Store Name", "Store ID", "Store Logo", "Age", "Gender",
                    "Mobile Number", "Email ID", "Account Status", "KYC status", "Remarks", "Country", "State", "City",
                    "Business Segment", "Business Sub-Segment", "Business Ownship Type", "Sponser ID"]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ fullName: regex }, { registerId: regex }, { mobileNo: regex }, { emailId: regex }] })
            }
            data['model'] = Sellers;
            data['stages'] = downloadFilesStages;
            data['projectData'] = downloadFilesStagesProjection;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = data.filter ? data.filter : {}
            data['fileName'] = 'sellers'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get login history Details
    Method: POST
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-24",
        "endDate":"2022-09-25"
    }
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async loginHistory() {
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
            let searchQuery = [{}]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                searchQuery.push({ $or: [{ "sellers.fullName": regex }, { "sellers.registerId": regex }] })
            }
            const result = await AccessTokens.aggregate([
                { $match: { $and: query, sellerId: { $exists: true } } },
                ...loginHistoryStages,
                { $match: { $and: searchQuery } },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await AccessTokens.aggregate([
                { $match: { $and: query, sellerId: { $exists: true } } },
                ...loginHistoryStages,
                { $match: { $and: searchQuery } },
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Login History Details
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getLoginHistoryDetailsOfSeller() {
        try {
            const loginHistoryId = this.req.params.loginHistoryId;
            if (!loginHistoryId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const loginHistory = await AccessTokens.aggregate([
                { $match: { _id: ObjectID(loginHistoryId) } },
                ...loginHistoryStages
            ])
            if (_.isEmpty(loginHistory) && loginHistory.length == 0)
                return this.res.send({ status: 0, message: "Seller details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: loginHistory[0] });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: Download csv and excel files
       Method: Post
       Authorisation: true
       Parameter:
       {
           "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "searchText": "",
            "filteredFields": ["Seller Name", "Seller ID", "Status", "IP Address", "Device", "Logged In Time", "Logged Out Time"]
        }
       Return: JSON String
       ********************************************************/
    async downloadLoginHistoryFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                console.log(`query: ${JSON.stringify(query)}`)
            }
            let searchQuery = [{}]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                searchQuery.push({ $or: [{ "sellers.fullName": regex }, { "sellers.registerId": regex }] })
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Seller Name", "Seller ID", "Store Name", "Store ID", "Status", "IP Address", "Device", "Logged In Time", "Logged Out Time"]

            data['model'] = AccessTokens;
            data['stages'] = downloadFilesOfLoginHistory;
            data['projectData'] = downloadFilesOfLoginHistoryProjection;
            data['key'] = 'createdAt';
            data['query'] = { $and: query, sellerId: { $exists: true } };
            data['filterQuery'] = { $and: searchQuery }
            data['fileName'] = 'sellers_login_history'
            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Kyc sellers Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2022-09-25",
        "filter": {
            "status": true,
            "kycDetails.status": "Approved",
            "country.name":"India"
        },
        "searchText":""
    }
    Return: JSON String
    ********************************************************/
    async kycSellersListing() {
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
                query.push({ $or: [{ fullName: regex }, { registerId: regex }, { mobileNo: regex }, { emailId: regex }] })
            }
            const filterQuery = data.filter ? data.filter : {}
            const result = await Sellers.aggregate([
                { $match: { isDeleted: false, $and: query } },
                ...kycSellersListingStages,
                { $match: filterQuery },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Sellers.aggregate([
                { $match: { isDeleted: false, $and: query } },
                ...kycSellersListingStages,
                { $match: filterQuery },
                { $project: { _id: 1 } }
            ])
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Kyc of Seller Details
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getKycSellerDetails() {
        try {
            const sellerId = this.req.params.sellerId;
            if (!sellerId) {
                return this.res.send({ status: 0, message: "Please send proper params" });
            }
            const getSeller = await Sellers.aggregate([
                { $match: { _id: ObjectID(sellerId), isDeleted: false } },
                ...getKycDetailsStages
            ])
            if (_.isEmpty(getSeller) && getSeller.length == 0)
                return this.res.send({ status: 0, message: "Seller details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: getSeller[0] });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
       Purpose: Download csv and excel files
       Method: Post
       Authorisation: true
       Parameter:
       {
            "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "filter": {
                "status": true,
                "kycDetails.status": "Approved",
                "country.name":"India"
            },
            "searchText": "",
            "filteredFields": ["Doj", "Seller Type","Seller ID","Seller Name","Seller Image", "Store Name", "Store ID", "Store Logo", "KYC Doc No","KYC Front Image","KYC Back Image","KYC Status","KYC Remarks","Country","Bank Name","Account No","Account Type","IFSC Code","IBAN Number","Swift Code","Branch Name", "Bank Statement","IEC Number","IEC Image","FSSAI No","FSSAI Doc Image","Legal Name","GST No","GST Image","Pan Image","Pan No", "Signature"]
        }
       Return: JSON String
       ********************************************************/
    async downloadKycSellerFiles() {
        try {
            let data = this.req.body;
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            let query = [{}];
            if (data.startDate || data.endDate) {
                query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
            }
            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Doj", "Seller ID", "Seller Name", "Seller Image", "Store Name", "Store ID", "Store Logo", "KYC Doc No", "KYC Front Image", "KYC Back Image", "KYC Status", "KYC Remarks", "Country", "Bank Name", "Account No", "Account Type", "IFSC Code", "IBAN Number", "Swift Code", "Branch Name", "Bank Statement", "IEC Number", "IEC Image", "FSSAI No", "FSSAI Doc Image", "Legal Name", "GST No", "GST Image", "Pan Image", "Pan No", "Signature"]
            if (data.searchText) {
                let regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ fullName: regex }, { registerId: regex }, { mobileNo: regex }, { emailId: regex }] })
            }
            data['model'] = Sellers;
            data['stages'] = downloadKycFilesStages;
            data['projectData'] = downloadKycFilesStagesProjection;
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false, $and: query };
            data['filterQuery'] = data.filter ? data.filter : {};
            data['fileName'] = 'sellers-kyc'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
        Purpose: Update kyc details of Seller by admin
        Method: Post
        Authorisation: true
        Parameter:
        {
            "status": "Rejected",
            "remarks": "Reason for rejection",
            "kycId":""
        }               
        Return: JSON String
    ********************************************************/
    async updateKycStatusofSellerByAdmin() {
        try {
            const data = this.req.body;
            const fieldsArray = data.status == "Rejected" ? ["status", "remarks", "kycId"] : ["status", "kycId"];
            const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
            }
            const kyc = await KycDetails.findOne({ _id: data.kycId, isDeleted: false });
            if (_.isEmpty(kyc))
                return this.res.send({ status: 0, message: "Kyc details not found" });
            await KycDetails.findByIdAndUpdate(data.kycId, data, { new: true, upsert: true });
            return this.res.send({ status: 1, message: "Kyc details updated successfully" });
        }
        catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }
}
module.exports = SellerManagementController;