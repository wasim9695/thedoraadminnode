const _ = require("lodash");
const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Model = require("../../utilities/model");
const Services = require("../../utilities/index");
const connection = require("../../config/db");


class CouponsController extends Controller {
    constructor() {
        super();
    }
    /********************************************************
     Purpose: Get available coupons details
     Method: Get
     Return: JSON String
     ********************************************************/
    async getAvailableCoupons() {
         try {
      const data = this.req.body;
      const userId = this.req.user;

      if (!data.couponCode) {
        return this.res.send({ status: 0, message: 'Please send type and couponCode' });
      }

      const date = new Date();
      const query = `
        SELECT *
        FROM Coupons
        WHERE couponCode = ? 
        AND userLimit > 0  -- User limit must be greater than 0
        AND minShoppingAmount <= ? 
        AND maxShoppingAmount >= ?`;

      connection.query(query, [data.couponCode, data.cartValue, data.cartValue], (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }

        if (results.length === 0) {
          return this.res.send({ status: 0, message: 'Coupon details not found or conditions not met' });
        }

        const couponDetails = results[0];

        // Update the couponDetails object if needed

        // Now, use an UPDATE query to decrement userLimit if necessary
        const updateQuery = `
          UPDATE Coupons
          SET userLimit = userLimit - 1
          WHERE couponCode = ?`;

        connection.query(updateQuery, [data.couponCode], (updateError, updateResults) => {
          if (updateError) {
            console.error('Error executing MySQL update query:', updateError);
            return this.res.send({ status: 0, message: 'Failed to update coupon details' });
          }

          return this.res.send({ status: 1, message: 'Coupon details updated successfully', data: couponDetails });
        });
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      return this.res.send({ status: 0, message: 'Internal server error' });
    }
  }

    /********************************************************
    Purpose: Validate coupon details
    Method: POST
    {
        "type":"isGame",
        "couponCode":""
    }
    Return: JSON String
    ********************************************************/
    async validateCouponDetails() {
        try {
      const data = this.req.body;
      const userId = this.req.user;

      if (!data.type || !data.couponCode) {
        return this.res.send({ status: 0, message: 'Please send type and couponCode' });
      }

      // Assuming you have a table named 'cart' in your MySQL database
      const cartValue = await this.getCartTotal(userId, data.type);

      const date = new Date();
      const query = `
        SELECT _id, couponCode, discount, discountType
        FROM Coupons
        WHERE startDate <= ? 
        AND endDate >= ? 
        AND minShoppingAmount <= ? 
        AND maxShoppingAmount >= ?
        AND couponCode = ?`;

      connection.query(query, [date, date, cartValue, cartValue, data.couponCode], (error, results) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          return this.res.send({ status: 0, message: 'Internal server error' });
        }

        if (results.length === 0) {
          return this.res.send({ status: 0, message: 'Coupon details not found' });
        }

        const couponDetails = results[0];
        return this.res.send({ status: 1, message: 'Coupon is valid', data: couponDetails });
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      return this.res.send({ status: 0, message: 'Internal server error' });
    }
    }

}
module.exports = CouponsController


