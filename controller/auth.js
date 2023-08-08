const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');

const Controller = require('./base');
// const { AccessTokens } = require('../models/s_auth')
const Model = require("../utilities/model");
const connection = require("../config/db");
function queryAsync(query, params) {
    return new Promise((resolve, reject) => {
      connection.query(query, params, (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
}

class AuthController extends Controller {
    constructor() {
        super();
    }

    async createToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = crypto.randomBytes(64).toString('hex');
                const refreshToken = crypto.randomBytes(64).toString('hex');
                data.token = token;
                data.userId = data.id;
                data.refreshToken = refreshToken;
                data.tokenExpiryTime = moment().add(parseInt(540), 'minutes');
                data.refreshTokenExpiryTime = moment().add(parseInt(720), 'minutes');
                data.role = data.role;
                delete data.id;
           // Find the existing access token
    const existingAuthQuery = 'SELECT * FROM access_tokens WHERE userId = ?';
    const existingAuthParams = [data.userId];
    const existingAuthResult = await queryAsync(existingAuthQuery, existingAuthParams);

    if (existingAuthResult.length > 0) {
      // Update the existing access token with empty values
      const updateQuery = 'UPDATE access_tokens SET token = ?, refreshToken = ?, action = ? WHERE _id = ?';
      const updateParams = [data.token, data.refreshToken, 'Relogged', existingAuthResult[0]._id];
      await queryAsync(updateQuery, updateParams);
      return resolve({ token, refreshToken });
    }else{
    // Store the new access token in the database
    const storeQuery = 'INSERT INTO access_tokens (userId, token, refreshToken) VALUES (?, ?, ?)';
    const storeParams = [data.userId, data.token, data.refreshToken];
    await queryAsync(storeQuery, storeParams);
    return resolve({ token, refreshToken });
    }

            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async createSellerToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = crypto.randomBytes(64).toString('hex');
                const refreshToken = crypto.randomBytes(64).toString('hex');
                data.token = token;
                data.sellerId = data.id;
                data.refreshToken = refreshToken;
                data.tokenExpiryTime = moment().add(parseInt(540), 'minutes');
                data.refreshTokenExpiryTime = moment().add(parseInt(720), 'minutes');
                data.role = data.role;
                delete data.id;
                const auth = await AccessTokens.findOne({ token: { $ne: "" }, sellerId: data.sellerId });
                if (!_.isEmpty(auth)) {
                    await AccessTokens.findByIdAndUpdate(auth._id, { token: "", refreshToken: "", action: 'Relogged' }, { new: true })
                }
                await new Model(AccessTokens).store(data);
                return resolve({ token, refreshToken });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async createAdminToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const token = crypto.randomBytes(64).toString('hex');
                const refreshToken = crypto.randomBytes(64).toString('hex');
                data.token = token;
                data.userId = data.id;
                data.refreshToken = refreshToken;
                data.tokenExpiryTime = moment().add(parseInt(540), 'minutes');
                data.refreshTokenExpiryTime = moment().add(parseInt(720), 'minutes');
                data.role = data.role;
                delete data.id;
           // Find the existing access token
    const existingAuthQuery = 'SELECT * FROM access_tokens WHERE userId = ?';
    const existingAuthParams = [data.userId];
    const existingAuthResult = await queryAsync(existingAuthQuery, existingAuthParams);

    if (existingAuthResult.length > 0) {
      // Update the existing access token with empty values
      const updateQuery = 'UPDATE access_tokens SET token = ?, refreshToken = ?, action = ? WHERE _id = ?';
      const updateParams = [data.token, data.refreshToken, 'Relogged', existingAuthResult[0]._id];
      await queryAsync(updateQuery, updateParams);
      return resolve({ token, refreshToken });
    }else{
    // Store the new access token in the database
    const storeQuery = 'INSERT INTO access_tokens (userId, token, refreshToken) VALUES (?, ?, ?)';
    const storeParams = [data.userId, data.token, data.refreshToken];
    await queryAsync(storeQuery, storeParams);
    return resolve({ token, refreshToken });
    }

            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async verifyRefreshToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let authData = await AccessTokens.findOne({
                    refreshToken: data.refreshToken, refreshTokenExpiryTime: {
                        $gt: moment(),
                    }
                });
                if (_.isEmpty(authData)) {
                    reject({ status: 0, message: "Invalid Refresh Token" })
                }

                return resolve({ id: authData.userId, role: authData.role });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async verifySellerRefreshToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let authData = await AccessTokens.findOne({
                    refreshToken: data.refreshToken, refreshTokenExpiryTime: {
                        $gt: moment(),
                    }
                });
                if (_.isEmpty(authData)) {
                    reject({ status: 0, message: "Invalid Refresh Token" })
                }

                return resolve({ id: authData.sellerId, role: authData.role });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async verifyAdminRefreshToken(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let authData = await AccessTokens.findOne({
                    refreshToken: data.refreshToken, refreshTokenExpiryTime: {
                        $gt: moment(),
                    }
                });
                if (_.isEmpty(authData)) {
                    reject({ status: 0, message: "Invalid Refresh Token" })
                }

                return resolve({ id: authData.adminId, role: authData.role });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        })
    }

    async generateToken() {
        return new Promise(async (resolve, reject) => {
            try {
                const token = crypto.randomBytes(64).toString('hex');
                return resolve(token);
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }

        });
    }
}
module.exports = AuthController;

