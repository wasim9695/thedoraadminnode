const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');

const Controller = require('../base');
const connection = require("../../config/db");
const RequestBody = require("../../utilities/requestBody");

const categoriesStages = [
    { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
];

const subCategoriesStages = [
    { $lookup: { from: "categories", localField: "subCategoryId", foreignField: "_id", as: "subCategory" } },
    { $unwind: "$subCategory" },
];

const childCategoriesStages = [
    { $lookup: { from: "categories", localField: "childCategoryId", foreignField: "_id", as: "childCategory" } },
    { $unwind: "$childCategory" },
];

const unitStages = [
    { $lookup: { from: "units", localField: "unitId", foreignField: "_id", as: "units" } },
    { $unwind: "$units" },
];


class AttributesController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
      Purpose: Add and update Attribute details
      Method: Post
      Authorisation: true
      Parameter:
      {
        "categoryId": "63e87d54916c08c8ae166caf",
        "subCategoryId":"63e87d72916c08c8ae166cb5",
        "childCategoryId":"63e87d7f916c08c8ae166cbb", 
        "unitId":"63e87d7f916c08c8ae166cbb",
        "attributeId": "" //optional 
      }               
      Return: JSON String
  ********************************************************/
    async addAndUpdateAttribute() {
            try {
              let fieldsArray = [
                "name",
                "price",
                "type"
              ];
              let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
              
              if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({
                  status: 0,
                  message: "Please send the following fields: " + emptyFields.toString() + "."
                });
              } else {
                const query = 'INSERT INTO productsattr SET ?';
                const userData = this.req.body;
                 if(userData._id){
                    const updateQuery = 'UPDATE productsattr SET price = ?, type = ?, name = ? WHERE _id = ?';
                    const updateValues = [userData.price, userData.type, userData.name, userData._id];
        
                    connection.query(updateQuery, updateValues, (err, result) => {
                      if (err) {
                        console.error('Error updating attribute:', err);
                        return this.res.status(500).json({ error: 'Failed to update attribute' });
                      } else {
                        this.res.status(200).json({ message: 'Attribute updated successfully' });
                      }
                    });
                 }else{
                // Check if the name or email already exists in the table
                const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM productsattr WHERE name = ?';
                connection.query(duplicateCheckQuery, [userData.name], (err, result) => {
                  if (err) {
                    console.error('Error adding item to cart:', err);
                    this.res.status(500).json({ error: 'Failed to add item to cart' });
                  } else {
                    const count = result[0].count;
              
                    if (count > 0) {
                      this.res.status(400).json({ error: 'Name already exists' });
                    } else {
                      if(userData._id){
                        
                      }

                      // Insert the data into the table
                      connection.query(query, userData, (err, result) => {
                        if (err) {
                          console.error('Error adding item to cart:', err);
                          this.res.status(500).json({ error: 'Failed to add item to cart' });
                        } else {
                          this.res.status(200).json({ message: ' added to  successfully' });
                        }
                      });
                    }
                  }
                });
            }
              
              }
        
            } catch (error) {
              console.log("error = ", error);
              return this.res.send({ status: 0, message: "Internal server error" });
            }
          
    }

    /********************************************************
   Purpose: Get Attribute Details
   Method: GET
   Authorisation: true            
   Return: JSON String
   ********************************************************/
    async getAttributeDetails() {
        try {
            const skip = 0;
            const limit = 20;
            const data = this.req.body;
            if (!data) {
              return this.res.send({ status: 0, message: 'Please send productsattr' });
            }
        
            let query = `SELECT * FROM productsattr WHERE status = 1`;
            let queryParams = [data];
        
        
            if (data.searchText) {
              query += ' AND productsattr LIKE ?';
              queryParams.push(`%${data.searchText}%`);
            }
        
            if (data.filter) {
              // Assuming the 'filter' property is a valid SQL condition string
              query += ` AND ${data.filter}`;
            }
        
            const selectQuery = `${query} ORDER BY createdAt DESC LIMIT 0, 10`;
            queryParams.push(skip, limit);
        
            connection.query(selectQuery, queryParams, (err, results) => {
              if (err) {
                console.error('Error fetching categories:', err);
                return this.res.send({ status: 0, message: 'Internal server error' });
              }
        
              return this.res.send({ status: 1, message: 'Details are:', data: results });
            });
          } catch (error) {
            console.error('Error:', error);
            return this.res.send({ status: 0, message: 'Internal server error' });
          }
    }

    /********************************************************
     Purpose: single and multiple Attribute change status
    Parameter:
    {
        "attributeIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
    }
    Return: JSON String
    ********************************************************/
    async changeStatusOfAttributes() {
        try {
            let msg = "Attribute status not updated";
            const updatedAttributes = await Attributes.updateMany({ _id: { $in: this.req.body.attributeIds } }, { $set: { status: this.req.body.status } });
            if (updatedAttributes) {
                msg = updatedAttributes.modifiedCount ? updatedAttributes.modifiedCount + " Attribute updated" : updatedAttributes.matchedCount == 0 ? "Attribute not exists" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Delete Attribute details
   Method: Post
   Authorisation: true
   Parameter:
   {
       "attributeIds":["5c9df24382ddca1298d855bb"]
   }  
   Return: JSON String
   ********************************************************/
    async deleteAttributes() {
        try {
            if (!this.req.body.attributeIds) {
                return this.res.send({ status: 0, message: "Please send attributeIds" });
            }
            let msg = 'Attribute not deleted.';
            let status = 1;
            const updatedAttributes = await Attributes.updateMany({ _id: { $in: this.req.body.attributeIds }, isDeleted: false }, { $set: { isDeleted: true } });
            if (updatedAttributes) {
                msg = updatedAttributes.modifiedCount ? updatedAttributes.modifiedCount + ' Attribute deleted.' : updatedAttributes.matchedCount == 0 ? "Details not found" : msg;
                status = updatedAttributes.matchedCount == 0 ? 0 : 1
            }
            return this.res.send({ status, message: msg });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
      Purpose: Attributes Listing In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
          "page":1,
          "pagesize":3,
          "startDate":"2022-09-20",
          "endDate":"2022-10-25",
          "searchText": ""
      }
      Return: JSON String
      ********************************************************/
    async attributesListing() {
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
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ name: regex },
                    { "category.categoryName": regex }, { "subCategory.categoryName": regex },
                    { "childCategory.categoryName": regex }, { "units.name": regex }, { "units.value": regex }]
                })
            }
            const result = await Attributes.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                ...unitStages,
                { $match: { $and: query } },
                {
                    $project: {
                        createdAt: 1, name: 1, status: 1, website: 1, image: 1, topAttribute: 1,
                        "units._id": "$units._id", "units.name": "$units.name",
                        "category._id": "$category._id", "category.categoryName": "$category.categoryName",
                        "subCategory._id": "$subCategory._id", "subCategory.categoryName": "$subCategory.categoryName",
                        "childCategory._id": "$childCategory._id", "childCategory.categoryName": "$childCategory.categoryName",
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Attributes.aggregate([
                { $match: { isDeleted: false } },
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                ...unitStages,
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
     Purpose: Download csv and excel files
     Method: Post
     Authorisation: true
     Parameter:
     {
        "type":"csv" or "excel",
        "startDate":"2022-09-20",
        "endDate":"2022-09-25",
        "searchText": "",
        "filteredFields":  ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Unit Name", "Status"]
     }
     Return: JSON String
     ********************************************************/
    async downloadAttributeFiles() {
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
                ["Date", "Category Name", "Sub-Category Name", "Child-Category Name", "Unit Name", "Status"]
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({
                    $or: [{ name: regex },
                    { "category.categoryName": regex }, { "subCategory.categoryName": regex },
                    { "childCategory.categoryName": regex }, { "units.name": regex }, { "units.value": regex }]
                })
            }
            data['model'] = Attributes;
            data['stages'] = [
                ...categoriesStages,
                ...subCategoriesStages,
                ...childCategoriesStages,
                ...unitStages,
                { $match: { $and: query } },];
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    "Category Name": "$category.categoryName",
                    "Sub-Category Name": "$subCategory.categoryName",
                    "Child-Category Name": "$childCategory.categoryName",
                    "Unit Name": "$units.name",
                    Status: "$status"
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { isDeleted: false };
            data['filterQuery'] = {}
            data['fileName'] = 'attributes'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = AttributesController;