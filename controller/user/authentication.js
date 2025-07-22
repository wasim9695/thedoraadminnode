/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");
const bcrypt = require('bcrypt');
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
    // Define required fields
    let fieldsArray = [
      "fullName",
      "emailId",
      "mobileNo",
      "password",
      "termsAndConditions"
    ];

    // Check for empty fields
    let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);

    if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
      return this.res.status(400).send({
        status: 0,
        message: "Please provide the following fields: " + emptyFields.toString() + "."
      });
    }

    const userData = this.req.body;

    // Hash the password before storing it
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    userData.password = hashedPassword; // Replace plain text password with hashed password

    // Check for duplicate users (fullName or emailId)
    const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE fullName = ? OR emailId = ?';
    connection.query(duplicateCheckQuery, [userData.fullName, userData.emailId], (err, result) => {
      if (err) {
        console.error('Error checking for duplicate user:', err);
        return this.res.status(500).json({ status: 0, message: 'Internal server error' });
      }

      const count = result[0].count;

      if (count > 0) {
        return this.res.status(400).json({ status: 0, message: 'Name or email already exists' });
      }

      // Insert the new user into the database
      const insertQuery = 'INSERT INTO users SET ?';
      connection.query(insertQuery, userData, (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return this.res.status(500).json({ status: 0, message: 'Failed to create user' });
        }

        return this.res.status(201).json({
          status: 1,
          message: 'User created successfully',
          userId: result.insertId // Return the ID of the newly created user
        });
      });
    });

  } catch (error) {
    console.error('Error in signUp function:', error);
    return this.res.status(500).json({ status: 0, message: 'Internal server error' });
  }
}


  async signIn() {
  try {
    const data = this.req.body;

    // Check if the request is for password-based login or OTP-based login
    if (data.username && data.password) {
      // Password-based login (emailId/password OR mobileNo/password)
      const { username, password } = data;

      // Query to find user by emailId or mobileNo
      const loginQuery = 'SELECT * FROM users WHERE (emailId = ? OR mobileNo = ?)';
      connection.query(loginQuery, [username, username], async (err, results) => {
        if (err) {
          console.error('Error executing login query:', err);
          return this.res.status(500).json({
            status: 0,
            message: "Internal server error"
          });
        }

        if (results.length === 0) {
          return this.res.status(400).json({
            status: 0,
            message: "Invalid username or password"
          });
        }

        const user = results[0];

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return this.res.status(400).json({
            status: 0,
            message: "Invalid username or password"
          });
        }

        // Generate tokens
        const { token, refreshToken } = await this.authentication.createToken({
          id: user._id,
          action: "Login",
        });

        return this.res.status(200).json({
          status: 1,
          message: "Login Successful",
          access_token: token,
          refresh_token: refreshToken,
          data: user,
        });
      });
    } else if (data.mobileNo && data.otp) {
      // OTP-based login (mobileNo and OTP)
      const { mobileNo, otp } = data;

      // Query to find user by mobileNo
      const otpQuery = 'SELECT * FROM users WHERE mobileNo = ? AND otp = ?';
      connection.query(otpQuery, [mobileNo, otp], async (err, results) => {
        if (err) {
          console.error('Error executing OTP login query:', err);
          return this.res.status(500).json({
            status: 0,
            message: "Internal server error"
          });
        }

        if (results.length === 0) {
          return this.res.status(400).json({
            status: 0,
            message: "Invalid mobile number or Otp"
          });
        }

        const user = results[0];

        // Validate OTP (replace with your OTP validation logic)
        const isValidOTP = await this.validateOTP(mobileNo, otp); // Implement this function
        if (!isValidOTP) {
          return this.res.status(400).json({
            status: 0,
            message: "Invalid OTP"
          });
        }

        // Generate tokens
        const { token, refreshToken } = await this.authentication.createToken({
          id: user._id,
          action: "Login",
        });

        return this.res.status(200).json({
          status: 1,
          message: "Login Successful",
          access_token: token,
          refresh_token: refreshToken,
          data: user,
        });
      });
    } else {
      // Invalid request
      return this.res.status(400).json({
        status: 0,
        message: "Please provide either username/password or mobileNo/OTP."
      });
    }

  } catch (error) {
    console.error("Error in login function:", error);
    return this.res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
}

// Example OTP validation function (replace with your actual OTP validation logic)
async validateOTP(mobileNo, otp) {
  // Implement your OTP validation logic here
  // For example, check if the OTP matches the one sent to the user's mobile number
  return true; // Replace with actual validation
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
        `<html><body><h2>HI! ${user.fullName} you have requested for a password change</h2><h3><strong>New password: </strong>jjjj</h3></body></html>`
      );
      const message = `Dear ${user.fullName}, Welcome to www.salar.in Your User ID is ${user._id}, Your Password is uuuu, Regards Strawberri World Solutions Private Limited.";`;
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

 try {
    const updatedProfile = this.req.body;

    // Validate required fields
    if (!updatedProfile.password || !updatedProfile._id) {
      return this.res.status(400).json({
        status: 0,
        message: "Please provide both password and user ID."
      });
    }

    // Hash the new password before storing it
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(updatedProfile.password, saltRounds);

    // Update the user's password in the database
    const updateQuery = 'UPDATE users SET password = ? WHERE _id = ?';
    connection.query(updateQuery, [hashedPassword, updatedProfile._id], (err, result) => {
      if (err) {
        console.error('Error updating user password:', err);
        return this.res.status(500).json({
          status: 0,
          message: "Failed to update user password"
        });
      }

      if (result.affectedRows === 0) {
        return this.res.status(404).json({
          status: 0,
          message: "User not found"
        });
      }

      return this.res.status(200).json({
        status: 1,
        message: "User password updated successfully"
      });
    });

  } catch (error) {
    console.error('Error in userPasswordChange function:', error);
    return this.res.status(500).json({
      status: 0,
      message: "Internal server error"
    });
  }
  }

async getUserAddresses(){
    const userId =  this.req.user;
    const newAddress = this.req.body.address;
  connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
    if (err) throw err;
    let existingAddresses ;
     existingAddresses = JSON.parse(results[0].shippingAddresses || []);
      this.res.status(200).json(existingAddresses);
  });
  }
  
  async userAddresses(){
    const userId =  this.req.user;
    const newAddress = this.req.body.address;
  connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
    if (err) throw err;
    let existingAddresses ;
    if(results==[]){
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



async userAddressesUpdateDefault () {
  const userId = this.req.user;
  const addressId = this.req.params.addressId;
  const updatedAddress = this.req.body.address;

  // Retrieve the existing addresses of the user
  connection.query('SELECT shippingAddresses FROM users WHERE _id = ?', [userId], (err, results) => {
    if (err) throw err;
    const existingAddresses = JSON.parse(results[0].shippingAddresses || []);

    // Iterate through existing addresses to set 'default' property
    for (let i = 0; i < existingAddresses.length; i++) {
      if (i === addressId) {
        existingAddresses[i] = { ...updatedAddress, defaultAddress: true };
      } else {
        existingAddresses[i].defaultAddress = false;
      }
    }
console.log(JSON.stringify(existingAddresses));
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

async addReview() {
        try {
    const data = this.req.body;
    const fieldsArray = ["rating", "title", "description", "type", "productId"];

    const emptyFields = fieldsArray.filter(field => !data[field]);
    if (emptyFields.length > 0) {
      return this.res.send({ status: 0, message: `Please send ${emptyFields.join(', ')} fields required.` });
    }

    // Checking user
    const currentUserId = this.req.user;
    data.userId = currentUserId;

    const userQuery = `SELECT fullName FROM users WHERE _id = ?`;
    connection.query(userQuery, [currentUserId], async (userErr, userResults) => {
      if (userErr) {
        console.error('Error fetching user:', userErr);
        return this.res.send({ status: 0, message: 'Internal server error' });
      }

      const user = userResults[0];
      // Insert new review into the database
      const newReviewQuery = `INSERT INTO Reviews (rating, title, description, type, productId, image, userId) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const newReviewValues = [data.rating, data.title, data.description, data.type, data.productId, data.image, data.userId];

      connection.query(newReviewQuery, newReviewValues, (reviewErr, reviewResults) => {
        if (reviewErr) {
          console.error('Error adding review:', reviewErr);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }

        const newReviewId = reviewResults.insertId;
        const newReview = { id: newReviewId, ...data, userFullName: user.fullName };
        return this.res.send({ status: 1, message: 'Details added successfully', data: newReview });
      });
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    return this.res.send({ status: 0, message: 'Internal server error' });
  }
    }



async getReview() {
  try {
    const productId = this.req.query.productId; // Get product ID from query parameter

    let getReviewsQuery = `
      SELECT r.*, u.fullName
      FROM Reviews r
      INNER JOIN users u ON r.userId = u._id
    `;

    if (productId) {
      getReviewsQuery += ` WHERE r.productId = ?`;
    }

    connection.query(getReviewsQuery, [productId], (getReviewsErr, reviewsResults) => {
      if (getReviewsErr) {
        console.error('Error fetching reviews:', getReviewsErr);
        return this.res.send({ status: 0, message: 'Internal server error' });
      }

      const reviews = reviewsResults.map(review => {
        return {
          id: review.id,
          rating: review.rating,
          title: review.title,
          description: review.description,
          type: review.type,
          productId: review.productId,
          image: review.image,
          userId: review.userId,
          userFullName: review.fullName
        };
      });

      return this.res.send({ status: 1, message: 'Reviews fetched successfully', data: reviews });
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    return this.res.send({ status: 0, message: 'Internal server error' });
  }
}


async logOut() {
        try {
            const token = this.req.token;
            // console.log("token", token)
            if (! token) {
                return this.res.send({status: 0, message: "Please send the token"});
            }
            const authQuery = 'SELECT * FROM access_tokens WHERE token = ? AND userId = ?';
    connection.query(authQuery, [token, this.req.user], (error, authRows) => {
      if (error) {
        console.error('error - ', error);
        return this.res.send({ status: 0, message: 'Internal server error' });
      }

      if (authRows.length === 0) {
        return this.res.send({ status: 0, message: 'Invalid token' });
      }
        const updateQuery = 'UPDATE access_tokens SET token = "", refreshToken = "", action = "Logout" WHERE _id = ?';
      connection.query(updateQuery, [authRows[0]._id], (updateError, updateResult) => {
        if (updateError) {
          console.error('error - ', updateError);
          return this.res.send({ status: 0, message: 'Failed to logout' });
        }

        if (updateResult.affectedRows === 0) {
          return this.res.send({ status: 0, message: 'Failed to logout' });
        }

        return this.res.send({ status: 1, message: 'Successfully logged out' });
      });
    });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({status: 0, message: "Internal server error"});
        }
    }



}
module.exports = UsersController;
