/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");
class UsersController extends Controller {
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
        "password",
        "termsAndConditions"
      ];
      let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
      
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message: "Please send the following fields: " + emptyFields.toString() + "."
        });
      } else {
        const query = 'INSERT INTO users SET ?';
        const userData = this.req.body;
      
        // Check if the name or email already exists in the table
        const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE fullName = ? OR emailId = ?';
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
                  this.res.status(200).json({ message: 'Item added to cart successfully' });
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
        const fieldsArray = ["username", "password"];
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
        const username = this.req.body.username;
        const password = this.req.body.password;
        
        // Check if the email and password fields are not empty
        if (!username || !password) {
          return this.res.status(400).json({ error: "Please provide email and password." });
        }
        
        // Query to check if the email and password match an existing user
        const loginQuery = 'SELECT * FROM users WHERE emailId = ? OR mobileNo = ? AND password = ?';
        connection.query(loginQuery, [username,username, password], async (err, results) => {
          if (err) {
            console.error('Error executing login query:', err);
            return this.res.status(500).json({ error: 'Failed to perform login operation.' });
          }
        
          if (results.length === 0) {
            // If no user is found with the provided email and password, return an error
            return this.res.send({status: 0,
              message: "Invalid email or password"});
          } else {
 console.log(results);
            const { token, refreshToken } = await this.authentication.createToken({
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

  async getUserProfile(){
    try {
      const userId = this.req.user;
      console.log(userId);

  // Fetch the user's profile data from the database
  // Replace 'users' with your actual table name
  connection.query(
    'SELECT * FROM users WHERE _id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        this.res.status(500).json({ error: 'Failed to fetch user profile' });
      } else if (results.length === 0) {
        this.res.status(404).json({ error: 'User not found' });
      } else {
        const userProfile = results[0];
        // Do not include sensitive data (e.g., password) in the response
        delete userProfile.password;
        this.res.status(200).json(userProfile);
      }
    }
  );
  } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }


  async editUserProfile(){
    const userId = this.req.user;

  // Get the updated profile data from the request body
  const updatedProfile = this.req.body;

  // Update the user's profile data in the database
  // Replace 'users' with your actual table name
  connection.query(
    'UPDATE users SET ? WHERE _id = ?',
    [updatedProfile, userId],
    (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        this.res.status(500).json({ error: 'Failed to update user profile' });
      } else if (result.affectedRows === 0) {
        this.res.status(404).json({ error: 'User not found' });
      } else {
        this.res.status(200).json({ message: 'User profile updated successfully' });
      }
    }
  );
  }






  async userForgetPassoord(){
    const { emailId } = this.req.body;
    console.log(emailId);
    // Check if the email exists in the database
    // Replace 'users' with your actual table name
    connection.query(
      'SELECT * FROM users WHERE emailId = ?',
      [emailId],
      (err, results) => {
        if (err) {
          console.error('Error fetching user:', err);
          this.res.status(500).json({ error: 'Failed to initiate password reset' });
        } else if (results.length === 0) {
          this.res.status(404).json({ error: 'User not found' });
        } else {
          const user = results[0];
  
          // Save the reset token and its expiration date to the user's record in the database
          // Replace 'users' with your actual table name and 'resetToken' and 'resetTokenExpiry' with the appropriate column names
          connection.query(
            'SELECT * FROM users WHERE _id = ?',
            [user._id], // Token expires in 1 hour (3600000 milliseconds)
            async (err) => {
              if (err) {
                console.error('Error saving reset token:', err);
                this.res.status(500).json({ error: 'Failed to initiate password reset' });
              } else {
                // Send the reset token to the user's email (you can use a library like Nodemailer to send emails)
                 // Sending email
      await this.services.sendEmail(
        user.emailId,
        "Salar",
        "",
        `<html><body><h2>HI! ${user.name} you have requested for a password change</h2><h3><strong>New password: </strong>jjjj</h3></body></html>`
      );
      const message = `Dear ${user.name}, Welcome to www.salar.in Your User ID is ${user.registerId}, Your Password is uuuu, Regards Strawberri World Solutions Private Limited.";`;
      // Sending message // Replace this with your email sending logic
  
                this.res.status(200).json({ message: 'Password reset initiated. Please check your email for instructions.' });
              }
            }
          );
        }
      }
    );

  }


  async userPassowrdChanage(){

  const updatedProfile = this.req.body;
  // Update the user's profile data in the database
  // Replace 'users' with your actual table name
  connection.query(
    'UPDATE users SET password = ? WHERE _id = ?',
    [updatedProfile.password, updatedProfile._id],
    (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        this.res.status(500).json({ error: 'Failed to update user profile' });
      } else if (result.affectedRows === 0) {
        this.res.status(404).json({ error: 'User not found' });
      } else {
        this.res.status(200).json({ message: 'User profile updated successfully' });
      }
    }
  );
  }


  async userAddresses(){
    const userId =  this.req.user;
    const newAddress = this.req.body.address;
  connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
    if (err) throw err;
    let existingAddresses ;
    if(results===[]){
    existingAddresses = results[0].shippingAddresses || [];
    existingAddresses.push(newAddress);
    }else{
      existingAddresses = JSON.parse(results[0].shippingAddresses || []);
      existingAddresses.push(newAddress);
    }

    // Update the addresses in the database
    connection.query('UPDATE users SET shippingAddresses = ? WHERE _id = ?', [JSON.stringify(existingAddresses), userId], (err) => {
      if (err) throw err;
      this.res.status(200).send('Address added successfully!');
    });
  });
  }

  async userAddressesUpdate(){
    const userId =  this.req.user;
    const addressId = this.req.params.addressId;
  const updatedAddress = this.req.body.address;
  // Retrieve the existing addresses of the user
  connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
    if (err) throw err;
    const existingAddresses = JSON.parse(results[0].shippingAddresses || []);

    // Update the specific address
    existingAddresses[addressId] = updatedAddress;
    // Update the addresses in the database
    connection.query('UPDATE users SET shippingAddresses = ? WHERE _id = ?', [JSON.stringify(existingAddresses), userId], (err) => {
      if (err) throw err;
      this.res.status(200).send('Address updated successfully!');
    });
  });
  }


  async userAddressesDelete(){
    const userId = this.req.user;
    const addressId = this.req.params.addressId;
  
    try {
      // Retrieve the existing addresses of the user
      const results = await new Promise((resolve, reject) => {
        connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
          if (err) reject(err);
          resolve(results);
        });
      });
  
      const existingAddressesData = results[0].shippingAddresses || '[]';
  
      // Parse the existing addresses data into a JavaScript array
      let existingAddresses;
      try {
        existingAddresses = JSON.parse(existingAddressesData);
      } catch (err) {
        // If there's an error parsing the data, set existingAddresses as an empty array
        existingAddresses = [];
      }
  
      // Check if the addressId is valid
      if (addressId >= existingAddresses.length || addressId < 0) {
        return this.res.status(400).send('Invalid addressId');
      }
  
      // Remove the specific address
      existingAddresses.splice(addressId, 1);
  
      // Update the addresses in the database
      await new Promise((resolve, reject) => {
        connection.query('UPDATE users SET shippingAddresses = ? WHERE _id = ?', [JSON.stringify(existingAddresses), userId], (err) => {
          if (err) reject(err);
          resolve();
        });
      });
  
      this.res.status(200).send('Address deleted successfully!');
    } catch (err) {
      console.error(err);
      this.res.status(500).send('Internal server error');
    }
}

}
module.exports = UsersController;
