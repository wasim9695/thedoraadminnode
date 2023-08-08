const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");


class BannerController extends Controller {
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
    async addBnners() {
        try {
            const data = this.req.body;
            connection.query('INSERT INTO banners (imageUrl, altText, pathUrl, heading) VALUES (?, ?, ?, ?)', 
            [data.imageUrl, data.altText, data.pathUrl, data.heading], (err, results) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Error inserting banner image into the database.');
                }
            
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


    async getBanner() {
        try {
            connection.query('Select * from banners where status = 1 and typeImages="banner"', (err, results) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Error inserting banner image into the database.');
                }
            
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
    async getBannerLeftSideBanner() {
        try {
            connection.query('Select * from banners where status = 1 and typeImages="leftBanner"', (err, results) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Error inserting banner image into the database.');
                }
            
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

    async getBannerRightSideBanner() {
        try {
            connection.query('Select * from banners where status = 1 and typeImages="rightBanner"', (err, results) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Error inserting banner image into the database.');
                }
            
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }

     async getBannerBottom() {
        try {
            connection.query('Select * from banners where status = 1 and typeImages="bottomBanner"', (err, results) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send('Error inserting banner image into the database.');
                }
            
                return this.res.send({ status: 1, message: 'Details are:', data: results });
              });
        } catch (error) {
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }


}
module.exports = BannerController;