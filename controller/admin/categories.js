const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');

const Controller = require('../base');
// const { AccessTokens } = require('../models/s_auth')
const Model = require("../../utilities/model");
const connection = require("../../config/db");
const RequestBody = require("../../utilities/requestBody");


class CategoriesController extends Controller {
    constructor() {
        super();
        this.requestBody = new RequestBody();
    }

    /********************************************************
    Purpose: Add And Update Category Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryName":"clothess",
        "customUrl": "clothess",
        "description": "clothess",
        "publish": true,
        "parentCategory":"5ccbd647eb89f20b11500fea",
        "image":"Image155490405914410.png",
        "metaTitle": "Meta Title",
        "type":"category",
        "metaKeyword": "Meta Title\nMeta Keyword",
        "metaDescription": "Meta Title\nMeta Keyword\nMeta Description",
        "isFood": false,
        "isVegetable": false,
        "isGame": false,
        "isEcommerce": false,
        "categoryId":"5ccbd647eb89f20b11500fea",
    }
    Return: JSON String
    ********************************************************/
    async addCategory() {
        try {
          let data = this.req.body;
          const fieldsArray = ["categoryName", "publish", "image", "metaTitle", "metaKeyword", "metaDescription"];
          const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);
      
          if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
            return this.res.send({ status: 0, message: `Please send ${emptyFields.join(", ")} fields required.` });
          }
      
          if (!data._id) {
            let name = data.categoryName;
            let checkCategoryQuery = 'SELECT * FROM categories WHERE categoryName = ?';
            connection.query(checkCategoryQuery, [name], async (err, results) => {
              if (err) {
                console.error('Error checking category:', err);
                return this.res.send({ status: 0, message: 'Internal server error' });
              }
      
              if (results.length > 0) {
                return this.res.send({ status: 0, message: 'Name already exists' });
              }
      
              let categoryQuery = 'SELECT * FROM categories';
              connection.query(categoryQuery, async (err, category) => {
                if (err) {
                  console.error('Error fetching categories:', err);
                  return this.res.send({ status: 0, message: 'Internal server error' });
                }
      
                let custom = '';
                let check = name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
                for (let i = 0; i < category.length; i++) {
                  const customCategory = await checkCustomUrl(check);
                  if (customCategory.length === 0) {
                    break;
                  } else {
                    check = check + i;
                  }
                }
      
                let middle = name.substring(0, 3);
                data.categoryName = name;
                data.customUrl = check;
      
                const insertCategoryQuery = 'INSERT INTO categories SET ?';
                connection.query(insertCategoryQuery, [data], (err, newCategory) => {
                  if (err) {
                    console.error('Error adding category:', err);
                    return this.res.send({ status: 0, message: 'Internal server error' });
                  }
      
                  return this.res.send({ status: 1, message: 'Details added successfully', data: newCategory });
                });
              });
            });
          } else {
            if (data.categoryName && !data.customUrl) {
              let name = data.categoryName;
              let checkCategoryQuery = 'SELECT * FROM categories WHERE categoryName = ?';
              connection.query(checkCategoryQuery, [name, data.categoryId], async (err, results) => {
                if (err) {
                  console.error('Error checking category:', err);
                  return this.res.send({ status: 0, message: 'Internal server error' });
                }
      
                if (results.length > 0) {
                  return this.res.send({ status: 0, message: 'Name already exists' });
                }
      
                let categoryQuery = 'SELECT * FROM categories';
                connection.query(categoryQuery, async (err, category) => {
                  if (err) {
                    console.error('Error fetching categories:', err);
                    return this.res.send({ status: 0, message: 'Internal server error' });
                  }
      
                  let custom = '';
                  let check = name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
                  for (let i = 0; i < category.length; i++) {
                    const customCategory = await checkCustomUrl(check);
                    if (customCategory.length === 0) {
                      break;
                    } else {
                      check = check + i;
                    }
                  }
      
                  data.categoryName = name;
                  data.customUrl = check;
      
                  const updateCategoryQuery = 'UPDATE categories SET categoryName = ?, customUrl = ? WHERE _id = ?';
                  connection.query(updateCategoryQuery, [data.categoryName, data.customUrl, data.categoryId], (err, updatedCategory) => {
                    if (err) {
                      console.error('Error updating category:', err);
                      return this.res.send({ status: 0, message: 'Internal server error' });
                    }
      
                    return this.res.send({ status: 1, message: 'Details updated successfully', data: updatedCategory });
                  });
                });
              });
            }
      
            // Add other conditions for updating other fields in the category
          }
        } catch (error) {
          console.log('Error:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }
      }
      
      async checkCustomUrl(customUrl) {
        return new Promise((resolve, reject) => {
          const customQuery = 'SELECT * FROM categories WHERE customUrl = ?';
          connection.query(customQuery, [customUrl], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      }
      

    /********************************************************
    Purpose: Delete Single And Multiple Category Details In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryIds":["5cd01da1371dc7190b085f86"]
    }
    Return: JSON String
    ********************************************************/
    async deleteCategories() {
        try {
          let model = this.req.body; // Replace 'categories' with the actual table name
          let msg = 'Category not deleted.';
      
          const deleteQuery = `UPDATE categories SET status = '0'  WHERE _id= ? `;
          const categoryIds = model.categoryIds;
      
          connection.query(deleteQuery, [categoryIds], (err, result) => {
            if (err) {
              console.error('Error deleting categories:', err);
              return this.res.send({ status: 0, message: 'Internal server error' });
            }
      
            console.log('Deleted categories:', result.affectedRows);
            if (result.affectedRows > 0) {
              msg = `${result.affectedRows} category deleted.`;
            } else {
              msg = 'Details not found';
            }
      
            return this.res.send({ status: 1, message: msg });
          });
        } catch (error) {
          console.error('Error:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }
      }

    /********************************************************
    Purpose: Change Status Of Category In Admin
    Method: Post
    Authorisation: true
    Parameter:
    {
        "categoryIds":["5cd01da1371dc7190b085f86"],
        "publish":false
    }
    Return: JSON String
    ********************************************************/
    async changeCategoryStatus() {
        try {
            let model = this.req.model ? this.req.model : Categories;
            let msg = 'Category details not updated.';
            const updatedCategory = await model.updateMany({ _id: { $in: this.req.body.categoryIds } }, { $set: { publish: this.req.body.publish } });
            if (updatedCategory) {
                msg = updatedCategory.modifiedCount ? updatedCategory.modifiedCount + ' Category details updated.' : updatedUser.n == 0 ? "Details not found" : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Get Category Details In Admin
    Method: POST
    {
        "categoryId":"5cd01da1371dc7190b085f86",
        "type": "category"
    }
    Return: JSON String
    ********************************************************/
    async getCategoriesDetails() {
        try {
            const data = this.req.body;
            const stages = data.type == 'category' ? [] :
                (data.type == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.type == 'category' ? {} :
                (data.type == 'subCategory1' ? subCategoryProjection : childCategoryProjection);
            let category = await Categories.aggregate([
                { $match: { isDeleted: false, type: data.type, _id: ObjectID(data.categoryId) } },
                ...stages,
                {
                    $project: {
                        categoryName: 1, customUrl: 1, categoryId: 1,
                        image: 1, type: 1, metaDescription: 1, metaKeyword: 1,
                        metaTitle: 1, description: 1, publish: 1, createdAt: 1, isFood: 1, isVegetables: 1, isGame: 1, isEcommerce: 1,
                        ...projection
                    }
                }
            ]);
            if (_.isEmpty(category))
                return this.res.send({ status: 0, message: "Details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: category });

        } catch (error) {
            console.log(`error: ${error}`)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Getting Dropdowns For Filters In CategoryListing In Admin
    Method: Post
    Authorisation: true
    {
        "type":"subCategory1",
        "parentCategory":"5ccc4c8e5a16ae2b47ced986",
        "searchText":"as",
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false
        },
    }
    Return: JSON String
    ********************************************************/
    async categoryList() {
        try {
          const skip = 0;
          const limit = 20;
          const data = this.req.body;
          if (!data) {
            return this.res.send({ status: 0, message: 'Please send category type' });
          }
      
          let query = `SELECT * FROM categories WHERE status = 1`;
          let queryParams = [data];
      
      
          if (data.searchText) {
            query += ' AND categoryName LIKE ?';
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
      Purpose: categoryListing Based On Filter In Admin
      Method: Post
      Authorisation: true
      Parameter:
      {
            "page":1,
            "pagesize":3,
            "startDate":"2022-09-20",
            "endDate":"2022-10-25",
            "parentCategory":"",
            "type":"category",
            "filter":{
                "isFood": false,
                "isVegetables":false,
                "isEcommerce": true,
                "isGame": false
            },
            "searchText": ""
        }
      Return: JSON String
      ********************************************************/
    async categoryListing() {
        try {
            /* pagination code begins */
            const data = this.req.body;
            const skip = (parseInt(data.page) - 1) * parseInt(data.pagesize);
            const sort = data.sort ? data.sort : { _id: -1 };
            const limit = data.pagesize;
            /* pagination code ends */
            /* query code begins */
            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send category type" });
            }
            let query = [{ isDeleted: false, type: data.type }];

            if (data.startDate || data.endDate) {
                const dateQuery = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                query.push(...dateQuery)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }] })
            }
            if (data.parentCategory) {
                query.push({ parentCategory: ObjectID(data.parentCategory) })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            console.log(`query: ${JSON.stringify(query)}`);
            /* query code ends */
            /* aggregation code begins */

            const stages = data.type == 'category' ? [] :
                (data.type == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.type == 'category' ? {} :
                (data.type == 'subCategory1' ? subCategoryProjection : childCategoryProjection);
            const result = await Categories.aggregate([
                { $match: { $and: query } },
                ...stages,
                {
                    $project: {
                        categoryName: 1, customUrl: 1, categoryId: 1,
                        image: 1, type: 1, metaDescription: 1, metaKeyword: 1,
                        metaTitle: 1, description: 1, publish: 1, createdAt: 1, isFood: 1, isVegetables: 1, isGame: 1, isEcommerce: 1,
                        ...projection
                    }
                },
                { $sort: sort },
                { $skip: skip },
                { $limit: limit },
            ]);
            const total = await Categories.aggregate([
                { $match: { $and: query } },
                { $project: { _id: 1 } }
            ])
            /* aggregation code ends */
            return this.res.send({ status: 1, message: "Listing details are: ", data: result, page: data.page, pagesize: data.pagesize, total: total.length });
        }
        catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: getParentCategoryName In SubCategory In Admin
    Method: Get
    Return: JSON String
    ********************************************************/
    async getParentCategoryName() {
        try {
            const category = await Categories.findOne({ _id: this.req.params.categoryId }, { categoryName: 1 });
            return this.res.send({ status: 1, message: "Details are: ", data: category });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Delete Category Image In Admin
    Method: DELETE
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async deleteCategoryImage() {
        try {
            let category = await Categories.findOne({ _id: this.req.params.categoryId });
            if (_.isEmpty(category))
                return this.res.send({ status: 0, message: "Details not found" });
            let data = {}
            let deleteImage = category.image
            if (category.image != '') {
                let imagePath = 'public/products/upload/' + deleteImage
                fs.unlink(imagePath, (err) => { if (err) throw err; });
            }
            data.image = ''
            await Categories.findOneAndUpdate({ _id: this.req.params.categoryId }, data);
            return this.res.send({ status: 1, message: "Details deleted successfully" });
        } catch (error) {
            console.log("error", error)
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose: Getting Three Levels Of Categories For Dropdown In Admin
    Method: POST
    {
        "filter":{
            "isFood": false,
            "isVegetables":false,
            "isEcommerce": true,
            "isGame": false
        }
    }
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async catLevels() {
        try {
            const filter = this.req.body.filter ? this.req.body.filter : {}
            let cat = await Categories.find({ type: "category", isDeleted: false, ...filter }, { categoryName: 1 });
            if (_.isEmpty(cat))
                return this.res.send({ status: 0, message: "Details not found" });
            let categoryList = []
            for (let i = 0; i < cat.length; i++) {
                let category = {};
                category._id = cat[i]._id;
                category.categoryName = cat[i].categoryName;

                let cate = await Categories.find({ isDeleted: false, type: "subCategory1", parentCategory: cat[i]._id, ...filter }, { categoryName: 1 });
                if (cate.length > 0) {
                    let subCategoryArray = [];
                    for (let j = 0; j < cate.length; j++) {
                        let subCategory = {}
                        subCategory._id = cate[j]._id;
                        subCategory.categoryName = cate[j].categoryName;

                        let categ = await Categories.find({ "isDeleted": false, type: "subCategory2", "parentCategory": cate[j]._id, ...filter }, { _id: 1, categoryName: 1 });
                        if (categ.length > 0) {
                            subCategory.subCategory = categ;
                            subCategoryArray.push(subCategory)
                        }
                        else { subCategoryArray.push(subCategory) }
                        category.subCategoryArray = subCategoryArray
                    }
                }
                categoryList.push(category)
            }
            return this.res.send({ status: 1, message: "Category Details not found", data: categoryList });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    /********************************************************
    Purpose:Download CSV Of Categories Based On Filter In Admin
    Method: Post
    Authorisation: true
    Parameter:
     {
            "type":"csv" or "excel",
            "startDate":"2022-09-20",
            "endDate":"2022-09-25",
            "categoryType":"category",
            "filter":{
                "isFood": false,
                "isVegetables":false,
                "isEcommerce": true,
                "isGame": false
            },
            "searchText": "",
            "parentCategory":""
            "filteredFields": ["Parent Category Name", "Main Category Name", "Date", "Category Name", "Type", "Image","Custom Url", "Category Id", "Publish","Food Category", "Vegetable Category", "Game Category", "Ecommerce Category","Meta Title", "Meta Description", "Meta Keyword"] 
        }
    Return: JSON String
    ********************************************************/
    async downloadCategoriesFile() {
        try {
            let data = this.req.body;

            if (!data.type) {
                return this.res.send({ status: 0, message: "Please send type of the file to download" });
            }
            if (!data.categoryType) {
                return this.res.send({ status: 0, message: "Please send category type" });
            }
            const addOnFields = data.categoryType == 'category' ? [] :
                (data.categoryType == 'subCategory1' ? ["Parent Category Name"] : ["Parent Category Name", "Main Category Name"]);

            data.filteredFields = data.filteredFields ? data.filteredFields :
                ["Date", "Category Name", "Type", "Image", "Custom Url", "Category Id", "Publish", "Food Category", "Vegetable Category", "Game Category", "Ecommerce Category", "Meta Title", "Meta Description", "Meta Keyword", ...addOnFields]
            /* filter code begins */
            let query = [{ isDeleted: false, type: data.categoryType }];
            if (data.startDate || data.endDate) {
                const dateQuery = await new DownloadsController().dateFilter({ key: 'createdAt', startDate: data.startDate, endDate: data.endDate })
                query.push(...dateQuery)
            }
            if (data.searchText) {
                const regex = { $regex: `.*${this.req.body.searchText}.*`, $options: 'i' };
                query.push({ $or: [{ categoryName: regex }] })
            }
            if (data.filter) {
                query.push({ ...data.filter })
            }
            console.log(`query: ${JSON.stringify(query)}`)
            /* filter code ends */
            /* category type filteration code begins */
            const stages = data.categoryType == 'category' ? [] :
                (data.categoryType == 'subCategory1' ? subCategoryStages : childCategoryStages);
            const projection = data.categoryType == 'category' ? {} :
                (data.categoryType == 'subCategory1' ? subCategoryProjectionDownload : childCategoryProjectionDownload);
            /* category type filteration code ends */

            data['model'] = Categories;
            data['stages'] = stages;
            data['projectData'] = [{
                $project: {
                    Date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, "Category Name": "$categoryName", "Type": "$type", Image: "$image",
                    "Custom Url": "$customUrl", "Category Id": "$categoryId", "Publish": "$publish",
                    "Food Category": "$isFood", "Vegetable Category": "$isVegetable", "Game Category": "$isGame", "Ecommerce Category": "$isEcommerce",
                    "Meta Title": "$metaTitle", "Meta Description": "$metaDescription", "Meta Keyword": "$metaKeyword", ...projection
                }
            }];
            data['key'] = 'createdAt';
            data['query'] = { $and: query };
            data['filterQuery'] = {}
            data['fileName'] = 'categories'

            const download = await new DownloadsController().downloadFiles(data)
            return this.res.send({ status: 1, message: `${(data.type).toUpperCase()} downloaded successfully`, data: download });
        }
        catch (error) {
            console.log("error", error)
            this.res.send({ status: 0, message: error })
        }
    }



// subcateries

async addSubCategory() {
  try {
    let data = this.req.body;
    const fieldsArray = ["subcategoryName","categoryID", "publish", "image", "metaTitle", "metaKeyword", "metaDescription"];
    const emptyFields = await this.requestBody.checkEmptyWithFields(data, fieldsArray);

    if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
      return this.res.send({ status: 0, message: `Please send ${emptyFields.join(", ")} fields required.` });
    }

    if (!data._id) {
      let name = data.subcategoryName;
      let checkCategoryQuery = 'SELECT * FROM subcategories WHERE subcategoryName = ?';
      connection.query(checkCategoryQuery, [name], async (err, results) => {
        if (err) {
          console.error('Error checking category:', err);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }

        if (results.length > 0) {
          return this.res.send({ status: 0, message: 'Name already exists' });
        }

        let categoryQuery = 'SELECT * FROM subcategories';
        connection.query(categoryQuery, async (err, category) => {
          if (err) {
            console.error('Error fetching categories:', err);
            return this.res.send({ status: 0, message: 'Internal server error' });
          }

          let custom = '';
          let check = name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
          for (let i = 0; i < category.length; i++) {
            const customCategory = await checkCustomUrl(check);
            if (customCategory.length === 0) {
              break;
            } else {
              check = check + i;
            }
          }

          let middle = name.substring(0, 3);
          data.subcategoryName = name;
          data.customUrl = check;

          const insertCategoryQuery = 'INSERT INTO subcategories SET ?';
          connection.query(insertCategoryQuery, [data], (err, newCategory) => {
            if (err) {
              console.error('Error adding category:', err);
              return this.res.send({ status: 0, message: 'Internal server error' });
            }

            return this.res.send({ status: 1, message: 'Details added successfully', data: newCategory });
          });
        });
      });
    } else {
      if (data.categoryName && !data.customUrl) {
        let name = data.categoryName;
        let checkCategoryQuery = 'SELECT * FROM subcategories WHERE subcategoryName = ?';
        connection.query(checkCategoryQuery, [name, data.categoryId], async (err, results) => {
          if (err) {
            console.error('Error checking category:', err);
            return this.res.send({ status: 0, message: 'Internal server error' });
          }

          if (results.length > 0) {
            return this.res.send({ status: 0, message: 'Name already exists' });
          }

          let categoryQuery = 'SELECT * FROM subcategories';
          connection.query(categoryQuery, async (err, category) => {
            if (err) {
              console.error('Error fetching categories:', err);
              return this.res.send({ status: 0, message: 'Internal server error' });
            }

            let custom = '';
            let check = name.replace(/ /g, '-').replace(/[^\w-]+/g, '').replace(/\-\-+/g, '-');
            for (let i = 0; i < category.length; i++) {
              const customCategory = await checkCustomUrl(check);
              if (customCategory.length === 0) {
                break;
              } else {
                check = check + i;
              }
            }

            data.categoryName = name;
            data.customUrl = check;

            const updateCategoryQuery = 'UPDATE subcategories SET subcategoryName = ?, customUrl = ? WHERE _id = ?';
            connection.query(updateCategoryQuery, [data.categoryName, data.customUrl, data.categoryId], (err, updatedCategory) => {
              if (err) {
                console.error('Error updating category:', err);
                return this.res.send({ status: 0, message: 'Internal server error' });
              }

              return this.res.send({ status: 1, message: 'Details updated successfully', data: updatedCategory });
            });
          });
        });
      }

      // Add other conditions for updating other fields in the category
    }
  } catch (error) {
    console.log('Error:', error);
    return this.res.send({ status: 0, message: 'Internal server error' });
  }
}

async checkCustomUrl(customUrl) {
  return new Promise((resolve, reject) => {
    const customQuery = 'SELECT * FROM categories WHERE customUrl = ?';
    connection.query(customQuery, [customUrl], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}




async subcategoryList() {
  try {
    const skip = 0;
    const limit = 20;
    const data = this.req.body;
    if (!data) {
      return this.res.send({ status: 0, message: 'Please send category type' });
    }

    let query = `SELECT * FROM subcategories WHERE status = 1`;
    let queryParams = [data];


    if (data.searchText) {
      query += ' AND subcategoryName LIKE ?';
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

// end here



}
module.exports = CategoriesController


