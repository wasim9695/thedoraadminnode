/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");
class AdminAuthController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }


  async signUp() {
    try {
      let fieldsArray = [
        "fullName",
        "dob",
        "gender",
        "age",
        "emailId",
        "countryId",
        "mobileNo",
        "password"
      ];
      let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
      
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send the following fields: " + emptyFields.toString() + "."
        });
      } else {
        const query = 'INSERT INTO admins SET ?';
        const userData = this.req.body;
      
        // Check if the name or email already exists in the table
        const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM admins WHERE fullName = ? OR emailId = ?';
        connection.query(duplicateCheckQuery, [userData.fullName, userData.emailId], (err, result) => {
          if (err) {
            console.error('Error adding item to cart:', err);
            this.res.status(500).json({ error: 'Failed to add item to cart' });
          } else {
            const count = result[0].count;
      
            if (count > 0) {
              this.res.status(400).json({ error: 'Name or email already exists' });
            } else {
              // Insert the data into the table
              connection.query(query, userData, (err, result) => {
                if (err) {
                  console.error('Error adding item to cart:', err);
                  this.res.status(500).json({ error: 'Failed to add item to cart' });
                } else {
                  this.res.status(200).json({ message: ' added to successfully' });
                }
              });
            }
          }
        });
      
      }

    } catch (error) {
      console.log("error = ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }


  async signIn() {
    try {
      const data = this.req.body;
      if (data.grantType == "password") {
        const fieldsArray = ["emailId", "password"];
        const emptyFields = await this.requestBody.checkEmptyWithFields(
          data,
          fieldsArray
        );
   
      
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send the following fields: " + emptyFields.toString() + "."
        });
      } else {
        const email = this.req.body.emailId;
        const password = this.req.body.password;
        
        // Check if the email and password fields are not empty
        if (!email || !password) {
          return this.res.status(400).json({ error: "Please provide email and password." });
        }
        
        // Query to check if the email and password match an existing user
        const loginQuery = 'SELECT * FROM admins WHERE emailId = ? AND password = ?';
        connection.query(loginQuery, [email, password], async (err, results) => {
          if (err) {
            console.error('Error executing login query:', err);
            return this.res.status(500).json({ error: 'Failed to perform login operation.' });
          }
        
          if (results.length === 0) {
            // If no user is found with the provided email and password, return an error
            return this.res.status(401).json({ error: 'Invalid email or password.' });
          } else {
 console.log(results);
            const { token, refreshToken } = await this.authentication.createAdminToken({
              id: results[0]._id,
              action: "Login",
            });
            return this.res.send({
              status: 1,
              message: "Login Successful",
              access_token: token,
              refresh_token: refreshToken,
              data: results[0],
            });
            // Successful login, return success message or user data as needed
            // return this.res.status(200).json({ message: 'Login successful!', user: results[0] });
          }
        });
      
      }
    }

    } catch (error) {
      console.log("error = ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }


  async addCategory() {
    try {
      let fieldsArray = [
        "categoryName"
      ];
      let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
      
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send the following fields: " + emptyFields.toString() + "."
        });
      } else {
        const query = 'INSERT INTO categories SET ?';
        const userData = this.req.body;
      
        // Check if the name or email already exists in the table
        const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM categories WHERE categoryName = ?';
        connection.query(duplicateCheckQuery, [userData.categoryName], (err, result) => {
          if (err) {
            console.error('Error adding item to cart:', err);
            this.res.status(500).json({ error: 'Failed to add item to cart' });
          } else {
            const count = result[0].count;
      
            if (count > 0) {
              this.res.status(400).json({ error: 'Name  already exists' });
            } else {
              // Insert the data into the table
              connection.query(query, userData, (err, result) => {
                if (err) {
                  console.error('Error adding item to cart:', err);
                  this.res.status(500).json({ error: 'Failed to add item to cart' });
                } else {
                  this.res.status(200).json({ message: 'Item added to  successfully' });
                }
              });
            }
          }
        });
      
      }

    } catch (error) {
      console.log("error = ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }



}
module.exports = AdminAuthController;
