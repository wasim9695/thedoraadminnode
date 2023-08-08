const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");


class CategoriesController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }
    /********************************************************
     Purpose:Getting categories lists for website
     Method: Post
     Authorisation: true
     {
         "type":"subCategory1",
         "parentCategory":"5ccc4c8e5a16ae2b47ced986",
         "searchText":""
     }
     Return: JSON String
     ********************************************************/
    async getCategories() {
        try {

               let query = `SELECT * FROM categories WHERE status = 1`;
    
              connection.query(query, (err, results) => {
                if (err) {
                  console.error('Error fetching categories:', err);
                  return this.res.send({ status: 0, message: 'Internal server error' });
                }
          
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


async getSubCategories() {
        try {

             const userId = this.req.user;
            const data = this.req.body;

               let query = `SELECT * FROM subcategories WHERE categoryID = ? AND status = 1`;
    
              connection.query(query, [data.categoryId], (err, results) => {
                if (err) {
                  console.error('Error fetching categories:', err);
                  return this.res.send({ status: 0, message: 'Internal server error' });
                }
          
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
    async getSubCategoriesDefoult() {
        try {

             const userId = this.req.user;
            const data = this.req.body;

               let query = `SELECT * FROM subcategories WHERE status = 1`;
    
              connection.query(query, (err, results) => {
                if (err) {
                  console.error('Error fetching categories:', err);
                  return this.res.send({ status: 0, message: 'Internal server error' });
                }
          
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

}
module.exports = CategoriesController;