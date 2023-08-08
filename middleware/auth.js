/** @format */

const connection = require("../config/db");

function queryAsync(query, params) {
  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

class Authorization {
  static async isAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res.send({
        status: 0,
        message: "Access denied. No token provided.",
      });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const query = 'SELECT * FROM access_tokens WHERE token = ?';
      const params = [token];
      const result = await queryAsync(query, params);
      // Check if access token exists
      if (result.length > 0) {
        // return result[0];
        req.user = result[0].userId;
        req.token = token;
        next();
      } else {
        return res.send({
          status: 0,
          message: "Access denied. Token Expired.",
        });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.send({ status: 0, message: "Invalid token." });
    }
  }


   static async isAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res.send({
        status: 0,
        message: "Access denied. No token provided.",
      });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const query = 'SELECT * FROM access_tokens WHERE token = ?';
      const params = [token];
      const result = await queryAsync(query, params);
      // Check if access token exists
      if (result.length > 0) {
        if (result.role != "user") {
        // return result[0];
        req.user = result[0].userId;
        req.token = token;
        next();
      }} else {
        return res.send({
          status: 0,
          message: "Access denied. Token Expired.",
        });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.send({ status: 0, message: "Invalid token." });
    }
  }



  static async isAdminAuthorised(req, res, next) {
    let token = "";
    if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else {
      token = req.headers["authorization"];
      token = token ? token.split(" ")[1] : false;
    }
    //if no token found, return response (without going to the next middelware)
    //if no token found, return response (without going to the next middelware)
    if (!token)
      return res.send({
        status: 0,
        message: "Access denied. No token provided.",
      });
    try {
      //if can verify the token, set req.user and pass to next middleware
      const query = 'SELECT * FROM access_tokens WHERE token = ?';
      const params = [token];
      const result = await queryAsync(query, params);
      // Check if access token exists
      if (result.length > 0) {
        if (result.role != "admin") {
        // return result[0];
        req.user = result[0].userId;
        req.token = token;
        next();
      }} else {
        return res.send({
          status: 0,
          message: "Access denied. Token Expired.",
        });
      }
    } catch (ex) {
      //if invalid token
      console.log(ex);
      return res.send({ status: 0, message: "Invalid token." });
    }
  }

}

module.exports = Authorization;
