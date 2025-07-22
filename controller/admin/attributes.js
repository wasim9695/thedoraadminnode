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
        let conn; // Declare connection variable
        try {
          const data = this.req.body;
      
          // Get a connection from the pool
          conn = await new Promise((resolve, reject) => {
            connection.getConnection((err, connection) => {
              if (err) reject(err);
              resolve(connection);
            });
          });
      
          // Start transaction
          await new Promise((resolve, reject) => {
            conn.beginTransaction(err => {
              if (err) reject(err);
              resolve();
            });
          });
      
          // Validate required fields
          const requiredFields = ["product_id", "attribute_name", "attribute_value"];
          const emptyFields = await this.requestBody.checkEmptyWithFields(data, requiredFields);
          
          if (emptyFields?.length) {
            await new Promise(resolve => conn.rollback(() => resolve()));
            conn.release();
            return this.res.status(400).json({
              status: 0,
              message: `Missing required fields: ${emptyFields.join(', ')}`
            });
          }
      
          // Helper function to execute queries
          const executeQuery = (sql, values) => new Promise((resolve, reject) => {
            conn.query(sql, values, (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });
      
          if (data.id) {
            // Update existing attribute
            const existing = await executeQuery(
              'SELECT id FROM product_attributes WHERE id = ?',
              [data.id]
            );
      
            if (existing.length === 0) {
              await new Promise(resolve => conn.rollback(() => resolve()));
              conn.release();
              return this.res.status(404).json({ error: 'Attribute not found' });
            }
      
            // Perform update
            const result = await executeQuery(
              `UPDATE product_attributes 
               SET attribute_name = ?, attribute_value = ?, product_id = ?
               WHERE id = ?`,
              [data.attribute_name, data.attribute_value, data.product_id, data.id]
            );
      
            await new Promise((resolve, reject) => {
              conn.commit(err => {
                if (err) reject(err);
                resolve();
              });
            });
      
            conn.release();
            return this.res.status(200).json({
              message: 'Attribute updated successfully',
              affectedRows: result.affectedRows
            });
      
          } else {
            // Check for duplicate attribute
            const existing = await executeQuery(
              `SELECT id FROM product_attributes 
               WHERE product_id = ? 
               AND attribute_name = ? 
               AND attribute_value = ?`,
              [data.product_id, data.attribute_name, data.attribute_value]
            );
      
            if (existing.length > 0) {
              await new Promise(resolve => conn.rollback(() => resolve()));
              conn.release();
              return this.res.status(409).json({ 
                error: 'Attribute already exists for this product' 
              });
            }
      
            // Insert new attribute
            const result = await executeQuery(
              `INSERT INTO product_attributes 
               (product_id, attribute_name, attribute_value)
               VALUES (?, ?, ?)`,
              [data.product_id, data.attribute_name, data.attribute_value]
            );
      
            await new Promise((resolve, reject) => {
              conn.commit(err => {
                if (err) reject(err);
                resolve();
              });
            });
      
            conn.release();
            return this.res.status(201).json({
              message: 'Attribute added successfully',
              attributeId: result.insertId
            });
          }
        } catch (error) {
          if (conn) {
            await new Promise(resolve => conn.rollback(() => resolve()));
            conn.release();
          }
          console.error('Attribute operation failed:', error);
          return this.res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
          });
        }
      }
      



      async getProductsWithAttributes() {
        let conn; // Declare connection variable
        try {
          // Get connection from pool
          conn = await new Promise((resolve, reject) => {
            connection.getConnection((err, connection) => {
              if (err) reject(err);
              resolve(connection);
            });
          });
      
          const query = `
            SELECT 
              p._id AS product_id,
              p.name,
              p.sku,
              p.unitprice,
              p.stock,
              COALESCE(GROUP_CONCAT(
                CASE WHEN pa.attribute_name = 'Color' 
                THEN pa.attribute_value END
              ), '') AS colors,
              COALESCE(GROUP_CONCAT(
                CASE WHEN pa.attribute_name = 'Size' 
                THEN pa.attribute_value END
              ), '') AS sizes
            FROM 
              products AS p
            LEFT JOIN 
              product_attributes AS pa ON p._id = pa.product_id
            WHERE 
              p.status = 'active'
            GROUP BY 
              p._id, p.name, p.sku, p.unitprice, p.stock;
          `;
      
          // Execute query
          const results = await new Promise((resolve, reject) => {
            conn.query(query, (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });
      
          return this.res.status(200).json(results);
      
        } catch (error) {
          console.error('Error fetching products:', error);
          return this.res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
          });
        } finally {
          // Release connection back to pool
          if (conn) conn.release();
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