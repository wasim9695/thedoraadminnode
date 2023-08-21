/** @format */

const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');
const Controller = require('../base');
const connection = require("../../config/db");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Authentication = require("../auth");

class ProductsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  /********************************************************
  Purpose: Get default values of product
  Method: POST
  {
    "categoryId": "63e87d54916c08c8ae166caf",
    "subCategoryId":"63e87d72916c08c8ae166cb5",
    "childCategoryId":"63e87d7f916c08c8ae166cbb", 
  }
  Authorisation: true            
  Return: JSON String
  ********************************************************/
  async getDefaultValuesOfProduct() {
    try {
      let data = this.req.body;
      const fieldsArray = ["categoryId"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
      }
      const checkCategory = await Categories.findOne({ _id: data.categoryId, type: "category", isDeleted: false });
      if (_.isEmpty(checkCategory)) {
        return this.res.send({ status: 0, message: "Category details not found" });
      }
      let query = { categoryId: data.categoryId }
      if (data.subCategoryId) {
        const checkSubCategory = await Categories.findOne({ _id: data.subCategoryId, type: "subCategory1", isDeleted: false });
        if (_.isEmpty(checkSubCategory)) {
          return this.res.send({ status: 0, message: "Sub-Category details not found" });
        }
        query = { ...query, subCategoryId: data.subCategoryId }
      }
      if (data.childCategoryId) {
        const checkChildCategory = await Categories.findOne({ _id: data.childCategoryId, type: "subCategory2", isDeleted: false });
        if (_.isEmpty(checkChildCategory)) {
          return this.res.send({ status: 0, message: "Child-Category details not found" });
        }
        query = { ...query, childCategoryId: data.childCategoryId }
      }
      query = { ...query, isDeleted: false }
      let brandFilter = [{}];
      if (data.searchText) {
        const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
        brandFilter.push({
          $or: [
            { name: regex }
          ]
        })
      }
      const brand = await Brands.find({ $and: brandFilter, ...query }, { name: 1 });
      const gst = await GSTCodes.findOne(query, { gst: 1, code: 1 });
      const commission = await Commissions.findOne(query, { commission: 1 });
      const attributes = await Attributes.findOne(query, { unitId: 1 }).populate('unitId', { name: 1, values: 1 });
      const transactionFee = await AdminSettings.findOne({ "isDeleted": false, }, { transactionFeeGlobal: 1, transactionFeeLocal: 1 })
      return this.res.send({ status: 1, data: { brand, gst, commission, attributes, transactionFee } });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Add and update product details
    Method: Post
    Authorisation: true
    Parameter:
    {
      "categoryIds": ["63e87d54916c08c8ae166caf","63e87d72916c08c8ae166cb5","63e87d7f916c08c8ae166cbb"],
      "brandId": "63fb03bafac9103ca0a28f78",
      "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
      "commissionId": "63fb2e51c05b36be844c4a5f",
      "length":22,
      "width": 21,
      "height": 20,
      "weight": 250,
      "hsnCode":"Testing",
      "name": "Oppo A74",
      "minPurchaseQty": 1,
      "maxPurchaseQty": 5,
      "barCode": "101102",
      "sku": "pro-sku-1",
      "unitPrice": 200,
      "otherTaxes": 5,
      "discountPoints": 10,
      "sponserCommission": 10,
      "discountDate": {
        "from": "22/03/2023",
        "to": "22/06/2023",
      },
      "discountType": "flat",
      "discount": 10,
      "attributes":  [
      {
        "colourId": "643a69b9d0731c1c4a9fafe1",
        "color": "Red",
        "gallaryImages": [
          {
            "imgSequence": 1,
            "imgLabel": "image-1",
            "imgName": "img1.jpg",
          },
        ],
        "values": [{
          "size": "S", "stock": 20, "price": 220,
        },{
          "size": "M", "stock": 20, "price": 240,
        }],
      },
      {
        "colourId": "643a69b9d0731c1c4a9fafe1",
        "color": "Green",
        "gallaryImages": [
          {
            "imgSequence": 1,
            "imgLabel": "image-1",
            "imgName": "img1.jpg",
          },
        ],
        "values": [{
          "size": "S", "stock": 20, "price": 220,
        },
      {
          "size": "L", "stock": 20, "price": 220,
        }],
      },
    ],
      "stock": 100,
      "stockWarning": true,
      "description": "product short description",
      "longDescription": "product long description",
      "shippingDays": 10,
      "returnAvailability": true,
      "returnTypes": ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "returnDays": 10,
      "replacementAvailability": true,
      'replacementTypes': ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "replacementDays": 10,
      "refundAvailability": true,
      "refundAmount": 80,
      "cancellationAvailability": true,
      "cancellationCharges":10,
      "productVideoUrl": "product.webm",
      "productPdf": "product.pdf",
      "productImage": "Product.png",
      "imageLabel": "Main image",
      "gallarygallaryImages": [
          {
          "imgSequence": 1,
          "imgLabel": "first-image",
          "imgName": "image1.jpg",
          },
      ],
      "tempImgArr": [
          {
            "imgSequence": 1,
          "imgLabel": "first-image",
          "imgName": "image1.jpg",
          },
      ],
      "temporarygallaryImages": [{ "imgName": "image1.jpg" }],
      "metaTitle": "meta title",
      "metaKeywords": "meta keywords",
      "metaDescription": "meta description",
      "productType":"Simple",
      "productDataType":"Physical",
      "bestSeller": true,
      "newArrival": true,
      "featured": true,
      "todaysDeal": true,
      "salarChoice": true,
      "festiveOffers": true,
      "productId": "" //optional 
    }               
    Return: JSON String
********************************************************/
  async addAndUpdateProduct() {
    try {
      const data = this.req.body;
      if (!data._id) {
        // Insert new product data
        const discountDates = `${data.startDate} to ${data.endDate}`;
        const insertQuery = 'INSERT INTO products SET ?';
          const productData = { 
            categoryIds: data.categoryIds,
            name: data.name,
            _id: data._id,
            minPurchaseQty: data.minPurchaseQty,
            maxPurchaseQty: data.maxPurchaseQty,
            sku: data.sku,
            unitprice: data.unitprice,
            totalPrice: data.totalPrice,
            otherTaxes: data.otherTaxes,
            discount: "20",
            stock: data.stock,
            shippingDays: data.shippingDays,
            returnAvailability: data.returnAvailability,
            returnDays: data.returnDays,
            replacementAvailability: data.replacementAvailability,
            replacementDays: data.replacementDays,
            refundAvailability: data.refundAvailability,
            cancellationAvailability: data.cancellationAvailability,
            cancellationCharges: data.cancellationCharges,
            status: data.status,
            bestSeller: data.bestSeller,
            newArrival: data.newArrival,
            featured: data.featured,
            todaysDeal: data.todaysDeal,
            festiveOffers: data.festiveOffers,
            freeDelivery: data.freeDelivery,
            freeDelivery: data.freeDelivery,
            attributes: data.attributes,
            gallaryImages:JSON.stringify(data.gallaryImages),
            productImage: data.productImage,
            description: data.description,
            discountDate: discountDates,
            discountType: data.discountType,
            longDescription: data.longDescription,
            metaDescription: data.metaDescription,
            metaKeywords: data.metaKeywords,
            metaTitle: data.metaTitle,
            productVideoUrl: data.productVideoUrl,
            refundAmount: data.refundAmount,
            rating: data.rating,
            reviewsCount: data.reviewsCount
            // Add other fields here
          };
        
        // Check if the name or SKU already exists in the table
        const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM products WHERE name = ? OR sku = ?';
        connection.query(duplicateCheckQuery, [data.name, data.sku], (err, result) => {
          if (err) {
            console.error('Error checking duplicate name or SKU:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const count = result[0].count;
  
            if (count > 0) {
              return this.res.status(400).json({ error: 'Name or SKU already exists' });
            } else {
              // Insert the data into the table
              connection.query(insertQuery, productData, (err, result) => {
                if (err) {
                  console.error('Error adding product:', err);
                  return this.res.status(500).json({ error: 'Failed to add product' });
                } else {
                  return this.res.status(200).json({ message: 'Product added successfully' });
                }
              });
            }
          }
        });
      } else {
        // Update existing product data
        const updateQuery = 'UPDATE products SET ? WHERE _id = ?';
        const productData = { 
          categoryIds: data.categoryIds,
          name: data.name,
          _id: data._id,
          minPurchaseQty: data.minPurchaseQty,
          maxPurchaseQty: data.maxPurchaseQty,
          sku: data.sku,
          price: data.unitprice,
          otherTaxes: data.otherTaxes,
          discount: data.discount,
          stock: data.stock,
          shippingDays: data.shippingDays,
          returnAvailability: data.returnAvailability,
          returnDays: data.returnDays,
          replacementAvailability: data.replacementAvailability,
          replacementDays: data.replacementDays,
          refundAvailability: data.refundAvailability,
          cancellationAvailability: data.cancellationAvailability,
          cancellationCharges: data.cancellationCharges,
          status: data.status,
          bestSeller: data.bestSeller,
          newArrival: data.newArrival,
          featured: data.featured,
          todaysDeal: data.todaysDeal,
          festiveOffers: data.festiveOffers,
          freeDelivery: data.freeDelivery,
          freeDelivery: data.freeDelivery,
          attributes: data.attributes,
          gallaryImages:JSON.stringify(data.gallaryImages),
          productImage: data.productImage,
          description: data.description,
          discountDate: discountDates,
          discountType: data.discountType,
          longDescription: data.longDescription,
          metaDescription: data.metaDescription,
          metaKeywords: data.metaKeywords,
          metaTitle: data.metaTitle,
          productVideoUrl: data.productVideoUrl,
          refundAmount: data.refundAmount,
          rating: data.rating,
          reviewsCount: data.reviewsCount
        };
        
        connection.query(updateQuery, [productData, data._id], (err, result) => {
          if (err) {
            console.error('Error updating product:', err);
            return this.res.status(500).json({ error: 'Failed to update product' });
          } else {
            return this.res.status(200).json({ message: 'Product updated successfully' });
          }
        });
      }
    } catch (error) {
      console.log("Error:", error);
      return this.res.status(500).json({ error: 'Internal server error' });
    }
  }

  /********************************************************
 Purpose: Get Product Details
 Method: GET
 Authorisation: true            
 Return: JSON String
 ********************************************************/
  async getProductLists() {
    try {
      const data = this.req.query;
      console.log(data);
      const page = parseInt(data.page) || 1; // Default to page 1 if not provided
const limit = parseInt(data.limit) || 10; // Default limit to 10 records per page if not provided
const offset = (page - 1) * limit;
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      console.log(data);
      let selectQuery;
      if(data.search){
        selectQuery = `
      SELECT p.*, 
  GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
  GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName, 'image', c.image)) AS categories
FROM products AS p
LEFT JOIN productsattr AS a ON p.attributes = a._id
LEFT JOIN categories AS c ON p.categoryIds = c._id
WHERE p.name LIKE '%${data.search}%' OR p.sku LIKE '%${data.search}%'
GROUP BY p._id
LIMIT ${limit}
OFFSET ${offset};
    `;
      }
    else{
      if(data.minPrice){
      selectQuery = `
      SELECT p.*, 
  GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
  GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName, 'image', c.image)) AS categories
FROM products AS p
LEFT JOIN productsattr AS a ON p.attributes = a._id
LEFT JOIN categories AS c ON p.categoryIds = c._id
WHERE p.totalPrice BETWEEN ${data.minPrice} AND ${data.maxPrice}
GROUP BY p._id
LIMIT ${limit}
OFFSET ${offset};
    `;
      }else{
        selectQuery = `
        SELECT p.*, 
    GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
    GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName, 'image', c.image)) AS categories
  FROM products AS p
  LEFT JOIN productsattr AS a ON p.attributes = a._id
  LEFT JOIN categories AS c ON p.categoryIds = c._id
  WHERE p.status=1
  GROUP BY p._id
  LIMIT ${limit}
  OFFSET ${offset};
      `;
      }
    }
        console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                name: data.name,
                _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes, 
              currentPage: page,
              totalPages: Math.ceil(totalRecords / limit) });
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }



  async getProductListByID() {
    try {
      const data = this.req.params;
      console.log(data);
      const page = parseInt(data.page) || 1; // Default to page 1 if not provided
const limit = parseInt(data.limit) || 10; // Default limit to 10 records per page if not provided
const offset = (page - 1) * limit;
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      console.log(data);
      let selectQuery;
      if (data.catID) {
      selectQuery = `
      SELECT p.*, 
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('_id', s._id, 'subcategoryName', s.subcategoryName,'image', s.image)) AS subcategories
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN subcategories AS s ON p.subcategoryIds = s._id
      WHERE s._id =${data.catID}
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
      SELECT p.*, 
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('_id', s._id, 'subcategoryName', s.subcategoryName,'image', s.image)) AS subcategories
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN subcategories AS s ON p.subcategoryIds = s._id
      WHERE p.name LIKE '%${data.search}%' OR p.sku LIKE '%${data.search}%'
      GROUP BY p._id
      LIMIT ${limit}
      OFFSET ${offset};
    `;
  }
        console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                subcategoryIds: JSON.parse(`${data.subcategories}`),
                name: data.name,
                _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes, 
              currentPage: page,
              totalPages: Math.ceil(totalRecords / limit) });
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }
  async getProductListByDetail() {
    try {
      const data = this.req.params;
      console.log(data);
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      console.log(data);
      let selectQuery;
      if (data.productId) {
      selectQuery = `
      SELECT p.*, 
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      WHERE p._id = ${data.productId}
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
      SELECT p.*, 
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      WHERE p._id = ${data.productId}
      GROUP BY p._id
    `;
  }
        console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                name: data.name,
                 _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes });
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }





async getNewArrivals() {
    try {
      const data = this.req.params;
      
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      let selectQuery;
      if (data) {
      selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.newArrival=1
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.newArrival=1
      GROUP BY p._id;
    `;
  }
        // console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                ratingsCount: JSON.parse(`${data.reviews}`),
                _id: data._id,
                name: data.name,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes});
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }




  async getBestSellers() {
    try {
      const data = this.req.params;
      
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      let selectQuery;
      if (data) {
      selectQuery = `
        SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.bestSeller=1
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
        SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.bestSeller=1
      GROUP BY p._id;
    `;
  }
        // console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                 categoryIds: JSON.parse(`${data.categories}`),
                ratingsCount: JSON.parse(`${data.reviews}`),
                 name: data.name,
               _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes});
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }


async getFeatured() {
    try {
      const data = this.req.params;
      
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      let selectQuery;
      if (data) {
      selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.featured=1
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.featured=1
      GROUP BY p._id;
    `;
  }
        // console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                ratingsCount: JSON.parse(`${data.reviews}`),
                name: data.name,
                 _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.unitprice,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes});
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }



async getTodayDeal() {
    try {
      const data = this.req.params;
      
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      let selectQuery;
      if (data) {
      selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.todaysDeal=1
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
       SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.todaysDeal=1
      GROUP BY p._id;
    `;
  }
        // console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                 ratingsCount: JSON.parse(`${data.reviews}`),
                name: data.name,
                 _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.price,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes});
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }


  async getFastival() {
    try {
      const data = this.req.params;
      
      if (!data) {
        return this.res.send({ status: 0, message: "Please send data" });
      }
      let selectQuery;
      if (data) {
      selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.festiveOffers=1
      GROUP BY p._id;
    `;
  } else {
    // Fetch products with pagination and search filtering
    selectQuery = `
      SELECT p.*, count(r.rating) as ratings,
      GROUP_CONCAT(JSON_OBJECT('_id', a._id, 'name', a.name, 'price', a.price, 'type', a.type)) AS productsattr,
      GROUP_CONCAT(JSON_OBJECT('_id', c._id, 'categoryName', c.categoryName,'image', c.image)) AS categories,
      GROUP_CONCAT(JSON_OBJECT('rating', r.rating)) AS reviews
      FROM products AS p
      LEFT JOIN productsattr AS a ON p.attributes = a._id
      LEFT JOIN categories AS c ON p.categoryIds = c._id
      LEFT JOIN reviews AS r ON p._id = r.productId
      WHERE p.festiveOffers=1
      GROUP BY p._id;
    `;
  }
        // console.log(selectQuery);
        connection.query(selectQuery, (err, result) => {
          if (err) {
            console.error('Error getting products with attributes:', err);
            return this.res.status(500).json({ error: 'Internal server error' });
          } else {
            const totalRecords = result.length;
            const productsWithAttributes = result.map((data) => {
              const product = {
                categoryIds: JSON.parse(`${data.categories}`),
                ratingsCount: JSON.parse(`${data.reviews}`),
                name: data.name,
                 _id: data._id,
                minPurchaseQty: data.minPurchaseQty,
                maxPurchaseQty: data.maxPurchaseQty,
                sku: data.sku,
                price: data.price,
                totalPrice: data.totalPrice,
                otherTaxes: data.otherTaxes,
                discount: data.discount,
                stock: data.stock,
                shippingDays: data.shippingDays,
                returnAvailability: data.returnAvailability,
                returnDays: data.returnDays,
                replacementAvailability: data.replacementAvailability,
                replacementDays: data.replacementDays,
                refundAvailability: data.refundAvailability,
                cancellationAvailability: data.cancellationAvailability,
                cancellationCharges: data.cancellationCharges,
                status: data.status,
                bestSeller: data.bestSeller,
                newArrival: data.newArrival,
                featured: data.featured,
                todaysDeal: data.todaysDeal,
                festiveOffers: data.festiveOffers,
                freeDelivery: data.freeDelivery,
                freeDelivery: data.freeDelivery,
                attributes: data.attributes,
                gallaryImages: data.gallaryImages,
                productImage: data.productImage,
                description: data.description,
                discountDate: data.discountDate,
                discountType: data.discountType,
                longDescription: data.longDescription,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords,
                metaTitle: data.metaTitle,
                productVideoUrl: data.productVideoUrl,
                refundAmount: data.refundAmount,
                rating: data.rating,
                reviewsCount: data.reviewsCount,
                attributes: JSON.parse(`${data.productsattr}`),  
              };
              return product;
            });
            return this.res.status(200).json({  data: productsWithAttributes});
          }
        });
      } catch (error) {
        console.log("Error:", error);
        return this.res.status(500).json({ error: 'Internal server error' });
      }
  }

  /********************************************************
   Purpose: single and multiple change status
  Parameter:
  {
      "productIds":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
      "status":true,
      "isAdmin": true
  }
  Return: JSON String
  ********************************************************/
  async changeStatusOfProducts() {
    try {
      const sellerId = this.req.user;
      let msg = "Product status not updated";
      const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.productIds } } : { _id: { $in: this.req.body.productIds }, sellerId: ObjectID(sellerId) };
      const updatedProducts = await Products.updateMany(query, { $set: { status: this.req.body.status } });
      if (updatedProducts) {
        msg = updatedProducts.modifiedCount ? updatedProducts.modifiedCount + " Product updated" : updatedProducts.matchedCount == 0 ? "Product not exists" : msg;
      }
      return this.res.send({ status: 1, message: msg });
    } catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }




  

  /********************************************************
 Purpose: Delete Product details
 Method: Post
 Authorisation: true
 Parameter:
 {
     "productIds":["5c9df24382ddca1298d855bb"],
      "isAdmin": true
 }  
 Return: JSON String
 ********************************************************/
  async deleteProducts() {
    try {
      const sellerId = this.req.user;
      if (!this.req.body.productIds) {
        return this.res.send({ status: 0, message: "Please send productIds" });
      }
      let msg = 'Product not deleted.';
      let status = 1;
      const query = this.req.body.isAdmin ? { _id: { $in: this.req.body.productIds }, isDeleted: false } : { _id: { $in: this.req.body.productIds }, sellerId: ObjectID(sellerId), isDeleted: false };

      const updatedProducts = await Products.updateMany(query, { $set: { isDeleted: true } });
      if (updatedProducts) {
        msg = updatedProducts.modifiedCount ? updatedProducts.modifiedCount + ' Product deleted.' : updatedProducts.matchedCount == 0 ? "Details not found" : msg;
        status = updatedProducts.matchedCount == 0 ? 0 : 1
      }
      return this.res.send({ status, message: msg });

    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Products Listing In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "page":1,
        "pagesize":3,
        "startDate":"2022-09-20",
        "endDate":"2023-10-25",
        "searchText": "long",
        "productType":"Simple",
        "productDataType":"Physical",
        "status":"Pending",
        "isAdmin": true,
        "filter":{
          "bestSeller": true,
          "newArrival": true,
          "featured": true,
          "todaysDeal": true,
          "salarChoice": true,
          "festiveOffers": true
        }
    }
    Return: JSON String
    ********************************************************/
  async productsListing() {
    try {
      const sellerId = this.req.user;
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
      }
      if (data.productType) {
        query.push({ productType: data.productType })
      }
      if (data.productDataType) {
        query.push({ productDataType: data.productDataType })
      }
      if (data.status) {
        query.push({ status: data.status })
      }
      if (data.filter) {
        query.push({ ...data.filter })
      }
      if (data.searchText) {
        const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
        query.push({
          $or: [
            { name: regex }, { description: regex }, { hsnCode: regex }, { longDescription: regex },
            { productId: regex }, { productType: regex }, { productDataType: regex }, { 'category.categoryName': regex },
            { 'brand.name': regex }, { 'seller.fullName': regex }, { 'store.name': regex }
          ]
        })
      }
      const matchQuery = this.req.body.isAdmin ? {
        isDeleted: false, description: { $exists: true }
      } : { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };

      console.log(`query: ${JSON.stringify(query)}`)
      const result = await Products.aggregate([
        { $match: matchQuery },
        ...stages,
        { $match: { $and: query } },
        ...projection,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Products.aggregate([
        { $match: matchQuery },
        ...stages,
        { $match: { $and: query } },
        ...projection,
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
        "productType":"Simple",
        "productDataType":"Physical",
        "status":"Pending",
        "isAdmin": true,
        "filter":{
          "bestSeller": true,
          "newArrival": true,
          "featured": true,
          "todaysDeal": true,
          "salarChoice": true,
          "festiveOffers": true
        }
        "filteredFields":["Date", "Product Name", "Product Image", "Product Id", "Product Type","Product Data Type", "Unit Price", "Stock", "Status", "Categories", "Brand", "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Net Price", "Updated Date"]
    }
   Return: JSON String
   ********************************************************/
  async downloadProductFiles() {
    try {
      const sellerId = this.req.user;
      let data = this.req.body;
      if (!data.type) {
        return this.res.send({ status: 0, message: "Please send type of the file to download" });
      }
      let query = [{}];
      if (data.startDate || data.endDate) {
        query = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
        console.log(`query: ${JSON.stringify(query)}`)
      }
      if (data.productType) {
        query.push({ productType: data.productType })
      }
      if (data.productDataType) {
        query.push({ productDataType: data.productDataType })
      }
      if (data.status) {
        query.push({ status: data.status })
      }
      if (data.filter) {
        query.push({ ...data.filter })
      }
      data.filteredFields = data.filteredFields ? data.filteredFields :
        ["Date", "Product Name", "Product Image", "Product Id", "Product Type", "Product Data Type", "Unit Price", "Stock", "Status", "Categories", "Brand", "GST Percentage", "GST Amount", "Other Taxes", "Commission Percentage", "Seller Name", "Store Name", "Sponser Commission", "Final Price", "Net Price", "Updated Date"]
      if (data.searchText) {
        const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
        query.push({
          $or: [
            { name: regex }, { description: regex }, { hsnCode: regex }, { longDescription: regex },
            { productId: regex }, { productType: regex }, { productDataType: regex }, { 'category.categoryName': regex },
            { 'brand.name': regex }, { 'seller.fullName': regex }, { 'store.name': regex }
          ]
        })
      }
      const matchQuery = this.req.body.isAdmin ? { isDeleted: false, description: { $exists: true } } :
        { isDeleted: false, sellerId: ObjectID(sellerId), description: { $exists: true } };

      data['model'] = Products;
      data['stages'] = [
        ...stages,
        { $match: { $and: query } },
        ...projection,
      ];
      data['projectData'] = [{
        $project: {
          Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          "Product Name": "$name",
          "Product Image": "$productImage",
          "Product Id": '$productId',
          "Product Type": "$productType",
          "Product Data Type": "$productDataType",
          "Unit Price": "$unitPrice",
          "Stock": "$stock",
          "Status": "$status",
          "Categories": "$categories.categoryName",
          "Brand": "$brand.name",
          "GST Percentage": "$gstCode.gst",
          "GST Amount": "$gstAmount",
          "Other Taxes": "$otherTaxes",
          "Commission Percentage": "$commission.commission",
          "Commission Amount": "$commissionAmount",
          "Seller Name": "$seller.fullName",
          "Store Name": "$store.name",
          "Sponser Commission": "$sponserCommission",
          "Final Price": "$finalPrice",
          "Net Price": "$netPrice",
          "Updated Date": { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt", timezone: "Asia/Kolkata" } },
        }
      }];
      data['key'] = 'createdAt';
      data['query'] = matchQuery;
      data['filterQuery'] = {}
      data['fileName'] = 'products'

      const download = await new DownloadsController().downloadFiles(data)
      return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });

    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: Delete related products of a product in admin
   Method: Post
   Authorisation: true
   Parameter:
   {
       "productId":"6402ed51f0c082f623a4683d",
       "ids":["6402ed58f0c082f623a4685a"]
   }
   Return: JSON String
   ********************************************************/
  async deleteRelatedProduct() {
    try {
      const details = await Products.findById({ _id: this.req.body.productId });
      const arr = details.relatedItems;
      const productIds = this.req.body.ids;
      for (let i = 0; i < productIds.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          if (arr[j].toString() === productIds[i]) { arr.splice(j, 1) }
        }
      }
      let data = {}
      data.relatedItems = arr;
      await Products.findByIdAndUpdate(this.req.body.productId, data)
      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
   Purpose: relatedProductsListing of product in admin
   Method: Post
   Authorisation: true
   Parameter:
   {
       "productId":"5cc922464e46c85a7261df96",
       "page":1,
       "pagesize":1,
       "sort":{
           "price":1
       }
   }
   Return: JSON String
   ********************************************************/
  async relatedProductsListing() {
    try {
      const data = this.req.body;
      const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
      const sort = data.sort ? data.sort : { _id: -1 };
      const limit = data.pagesize;
      const details = await Products.findById({ _id: this.req.body.productId });
      if (_.isEmpty(details)) { return this.res.send({ status: 0, message: "Details not found" }); }
      const related = details.relatedItems;
      const result = await Products.aggregate([
        { $match: { isDeleted: false, _id: { $in: related } } },
        ...stages,
        ...projection,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ]);
      const total = await Products.aggregate([
        { $match: { isDeleted: false, _id: { $in: related } } },
        ...stages,
        ...projection,
        { $project: { _id: 1 } }
      ])
      return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
  Purpose: Delete additional gallaryImages of products
  Method: Post
  Authorisation: true
  Parameter:
  {
      "productId":"5d4d25364418020e6056fe6f",
      "imageId":"5d50ff28b380220f7240167e"
  }
  Return: JSON String
  ********************************************************/
  async deleteAdditionalGallaryImages() {
    try {
      const sellerId = this.req.user;
      const product = await Products.findOne({
        _id: ObjectID(this.req.body.productId),
        sellerId: ObjectID(sellerId), "tempImgArr._id": ObjectID(this.req.body.imageId)
      },
        { "tempImgArr": 1, sku: 1, productType: 1 });
      console.log(`product: ${JSON.stringify(product)}`)
      if (_.isEmpty(product)) {
        return this.res.send({ status: 0, message: "Product details not found" });
      }
      const tempImgArr = product.tempImgArr.find(key => {
        return key._id == this.req.body.imageId
      })
      console.log(`tempImgArr: ${JSON.stringify(tempImgArr)}`)
      const deleteImage = tempImgArr.imgName;
      let imagePath = '';
      const sku = product.sku;
      const img = deleteImage.split(sku);
      const ext = img[1].slice(0, -4);
      if (deleteImage != undefined) {
        for (let i = 1; i <= 3; i++) {
          if (i === 1)
            imagePath = 'public/products/upload/' + deleteImage
          if (i === 2)
            imagePath = 'public/products/upload/' + sku + ext + '-sm' + '.jpg'
          if (i === 3)
            imagePath = 'public/products/upload/' + sku + ext + '-th' + '.jpg'
          fs.unlink(imagePath, (err) => { if (err) throw err; });
        }
      }
      await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { tempImgArr: { _id: ObjectID(this.req.body.imageId) } } });
      if (product.productType == 'Simple') {
        const product1 = await Products.findOne({ _id: ObjectID(this.req.body.productId), "gallaryImages.imgName": deleteImage });
        if (!_.isEmpty(product1)) {
          await Products.findOneAndUpdate({ _id: this.req.body.productId }, { $pull: { gallaryImages: { imgName: deleteImage } } });
        }
      } else {
        await Products.findOneAndUpdate({ _id: this.req.body.productId },
          { $pull: { "attributes.$[].values.$[].gallaryImages": { imgName: deleteImage } } });
      }

      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
  Purpose: Delete Main image of product
  Method: Get
  Return: JSON String
  ********************************************************/
  async deleteProductImage() {
    try {
      const sellerId = this.req.user;
      const product = await Products.findOne({ _id: this.req.params.productId, sellerId: ObjectID(sellerId), }, { productImage: 1, imageLabel: 1 });
      if (_.isEmpty(product)) { return this.res.send({ status: 0, message: "Details not found" }); }
      const deleteImage = (product.productImage) ? product.productImage : "";
      let imagePath = '';
      if (deleteImage != '') {
        let img = deleteImage.slice(0, -4);
        for (let i = 1; i <= 3; i++) {
          if (i === 1)
            imagePath = 'public/products/upload/' + deleteImage
          if (i === 2)
            imagePath = 'public/products/upload/' + img + '-sm' + '.jpg'
          if (i === 3)
            imagePath = 'public/products/upload/' + img + '-th' + '.jpg'
          fs.unlink(imagePath, (err) => { if (err) throw err; });
        }
      }
      let data = {}
      data.productImage = ''; data.imageLabel = ''
      await Products.findOneAndUpdate({ _id: this.req.params.productId }, data);
      return this.res.send({ status: 1, message: "Deleted successfully" });
    } catch (error) {
      console.log(`error: ${error}`)
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  /********************************************************
    Purpose: Update product details by admin
    Method: Post
    Authorisation: true
    Parameter:
    {
      "categoryIds": ["63e87d54916c08c8ae166caf","63e87d72916c08c8ae166cb5","63e87d7f916c08c8ae166cbb"],
      "brandId": "63fb03bafac9103ca0a28f78",
      "gstCodeId": "63fb286f7f32fcb1f61ac1d2",
      "commissionId": "63fb2e51c05b36be844c4a5f",
      "hsnCode":"Testing",
      "length":22,
      "width": 21,
      "height": 20,
      "weight": 250,
      "name": "Oppo A74",
      "minPurchaseQty": 1,
      "maxPurchaseQty": 5,
      "barCode": "101102",
      "sku": "pro-sku-1",
      "unitPrice": 200,
      "otherTaxes": 5,
      "discountPoints": 10,
      "sponserCommission": 10,
      "discountDate": {
        "from": "22/03/2023",
        "to": "22/06/2023",
      },
      "discountType": "flat",
      "discount": 10,
      "attributes": [{
        "unit": "63fb0d722ae4f74a0dfd0cd5",
        "type": "size",
        "value": ["S", "M"]
      }],
      "stock": 100,
      "stockWarning": true,
      "description": "product short description",
      "longDescription": "product long description",
      "shippingDays": 10,
      "returnAvailability": true,
      "returnTypes": ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "returnDays": 10,
      "replacementAvailability": true,
      'replacementTypes': ["63fb4d8e8465038a0f899c6c","63fb4d9e8465038a0f899c72"],
      "replacementDays": 10,
      "refundAvailability": true,
      "refundAmount": 80,
      "cancellationAvailability": true,
      "cancellationCharges":10,
      "productVideoUrl": "product.webm",
      "productPdf": "product.pdf",
      "productImage": "Product.png",
      "imageLabel": "Main image",
      "gallarygallaryImages": [
          {
          "imgSequence": 1,
          "imgLabel": "first-image",
          "imgName": "image1.jpg",
          },
      ],
      "tempImgArr": [
          {
            "imgSequence": 1,
          "imgLabel": "first-image",
          "imgName": "image1.jpg",
          },
      ],
      "temporarygallaryImages": [{ "imgName": "image1.jpg" }],
      "metaTitle": "meta title",
      "metaKeywords": "meta keywords",
      "metaDescription": "meta description",
      "productType":"simple",
      "productDataType":"Physical",
      "bestSeller": true,
      "newArrival": true,
      "featured": true,
      "todaysDeal": true,
      "salarChoice": true,
      "festiveOffers": true
      "productId": "" //optional 
    }               
    Return: JSON String
********************************************************/
  async updateProductDetailsByAdmin() {
    try {
      let data = this.req.body;
      const fieldsArray = ["categoryIds", "brandId", "gstCodeId", "commissionId", "name",
        "minPurchaseQty", "maxPurchaseQty", "barCode", "unitPrice", "discountPoints",
        "sponserCommission", "stock", "description", "longDescription", "shippingDays",
        "productImage", "imageLabel", "metaTitle", "metaKeywords", "metaDescription", "productType",
        "productDataType", "productId", "length", "width", "height", "weight", "hsnCode"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({ status: 0, message: "Please send" + " " + emptyFields.toString() + " fields required." });
      }
      const adminSettings = await AdminSettings.findOne({ "isDeleted": false, }, { _id: 1 })
      if (_.isEmpty(adminSettings)) { return this.res.send({ status: 0, message: "Admin settings details not found" }); }
      data.adminSettingsId = adminSettings._id;
      const checkCategories = await Categories.find({ _id: { $in: data.categoryIds }, isDeleted: false }, { categoryName: 1 });
      if (_.isEmpty(checkCategories) || checkCategories.length != 3) {
        return this.res.send({ status: 0, message: "Category details not found" });
      }
      const checkBrand = await Brands.findOne({ _id: data.brandId, isDeleted: false });
      if (_.isEmpty(checkBrand)) {
        return this.res.send({ status: 0, message: "Brand details not found" });
      }
      const checkGSTCode = await GSTCodes.findOne({ _id: data.gstCodeId, isDeleted: false });
      if (_.isEmpty(checkGSTCode)) {
        return this.res.send({ status: 0, message: "GSTCode details not found" });
      }
      const checkCommission = await Commissions.findOne({ _id: data.commissionId, isDeleted: false });
      if (_.isEmpty(checkCommission)) {
        return this.res.send({ status: 0, message: "Commission details not found" });
      }
      const product1 = await Products.findById(this.req.body.productId);
      if (_.isEmpty(product1)) { return this.res.send({ status: 0, message: "Product details not found" }); }

      data.sku = product1.sku;
      data.customUrl = product1.customUrl
      const checkName = await Products.findOne({ name: data.name, _id: { $nin: [data.productId] }, isDeleted: false });
      if (!_.isEmpty(checkName)) { return this.res.send({ status: 0, message: "Name already exists" }); }
      await Products.findByIdAndUpdate(data.productId, data, { new: true, upsert: true });
      return this.res.send({ status: 1, message: "Product updated successfully" });
    }
    catch (error) {
      console.log("error- ", error);
      this.res.send({ status: 0, message: error });
    }
  }

  /********************************************************
  Purpose:Getting Dropdowns For Filters In ProductListing In Admin
  Method: Post
  Authorisation: true
  Parameter:
  {
     "searchText":"",
     "categoryIds":[""],
     "sellerId": "",
     "isAdmin":true,
     "filter":{
            "bestSeller": true,
            "newArrival": true,
            "featured": true,
            "todaysDeal": true,
            "salarChoice": true,
            "festiveOffers": true
          }
  }
  Return: JSON String
  ********************************************************/
  async productFieldsList() {
    try {
      const data = this.req.body;
      const sort = { _id: -1 };
      const limit = 20;
      const matchQuery = { isDeleted: false, description: { $exists: true } };
      let query = [matchQuery]
      if (data.searchText) {
        const regex = { $regex: `.*${data.searchText}.*`, $options: 'i' };
        query.push({ $or: [{ name: regex }, { sku: regex }] })
      }
      if (data.categoryIds && data.categoryIds.length > 0) {
        data.categoryIds = await data.categoryIds.map(res => {
          return ObjectID(res)
        })
        query.push({ categoryIds: { $in: data.categoryIds } })
      }
      if (data.sellerId) {
        query.push({ sellerId: ObjectID(data.sellerId) })
      }
      if (data.filter) {
        query.push({ ...data.filter })
      }
      console.log(`query: ${JSON.stringify(query)}`)
      const result = await Products.aggregate([
        { $match: { $and: query } },
        { $project: { name: 1 } },
        { $sort: sort },
        { $limit: limit },
      ]);
      return this.res.send({ status: 1, message: "Listing details are: ", data: result });

    } catch (error) {
      console.log("error", error)
      return this.res.send({ status: 0, message: "Internal Server Error" });
    }
  }


 



}
module.exports = ProductsController;
