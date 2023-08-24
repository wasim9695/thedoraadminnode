const _ = require("lodash");
const crypto = require('crypto');
const moment = require('moment');
const Controller = require('../base');
const connection = require("../../config/db");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Authentication = require("../auth");
class OrderController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
  }


  async getproducts(productsArray) {
    return new Promise((resolve, reject) => {
      const duplicateCheckQuery = 'SELECT * FROM products WHERE _id IN (?)';
        connection.query(duplicateCheckQuery, [productsArray], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async placeOrder() {
    try {
      const orderData = this.req.body.products;
    let bulkInsertDataArray = [];
    
    for (let order of orderData) {
      const prods = await this.getproducts(order.products);
      // Push an array containing values in the correct order as per the 'orders' table
      bulkInsertDataArray.push([
        order.orderId,
        order.userId,
        JSON.stringify(prods), // Assuming 'products' is an array of objects
        order.orderDate,
        order.totalAmount,
        order.paymentMethod,
        order.paymentStatus,
        order.shippingAddress,
        order.discount,
        order.deliveryCharges,
        order.shippingCity,
        order.shippingZipcode,
        order.shippingCountry,
        order.orderStatus
      ]);
    }
      
      const duplicateCheckQuery = 'INSERT INTO orders (orderId,	userId,	products,	orderDate,	totalAmount,	paymentMethod,	paymentStatus,	shippingAddress,	discount,	deliveryCharges,	shippingCity,	shippingZipcode,	shippingCountry,	orderStatus) VALUES ?';
        connection.query(duplicateCheckQuery, [bulkInsertDataArray], (err, result) => {
          console.log(err);
      // Execute the bulk insert query
      this.res.send({
        status: 1,
        message: "Order Placed",
        data: result,
      });
    });
    } catch (error) {
      console.error("Error in placing product order", error);
      this.res.status(500).send({ status: 0, message: error.message, data: error });
    }
  }


  async getAllOrder() {
    try {
      let user_id = "";
      if (this.req.user) {
        user_id = this.req.user;
      } else {
        user_id = this.req.user;
      }
        const duplicateCheckQuery = 'SELECT * FROM orders WHERE userId = ?';
        connection.query(duplicateCheckQuery, [user_id], (err, result) => {

const totalRecords = result.length;
            const productsAll = result.map((data) => {
              const product = {
                 products: JSON.parse(`${data.products}`),
               _id: data._id,
               orderId: data.orderId,
                orderDate: data.orderDate,
                totalAmount: data.totalAmount,
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                shippingAddress: data.shippingAddress,
                shippingCity: data.shippingCity,
                shippingZipcode: data.shippingZipcode,
                shippingCountry: data.shippingCountry,
                discount: data.discount,
                deliveryCharges: data.deliveryCharges,
                orderStatus: data.orderStatus, 
              };
              return product;
            });

      return this.res.send({ status: 1, data: productsAll, message: "Orders" });
      });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getOrderByUsingID() {
    try {
      let user_id = "";
      if (this.req.params) {
        user_id = this.req.params;
      } else {
        user_id = this.req.user;
      }
      const order = await Order.find({
        user_id: user_id?.user_id,
        _id: user_id?.id,
      })
      return this.res.send({ status: 1, data: order, message: "Orders" });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  AddRefund = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "refund_amount",
        "product_details",
        "refund_status",
        "payment_method",
        "cancel_order",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderRefund).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order refund not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Refund added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderRefund = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderRefund.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddReturn = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "replacement_status",
        "refund_status",
        "product_details",
        "payment_method",
        "return_reason",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderReturnOrReplace).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order return not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order return added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderReturn = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderReturnOrReplace.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddProductchat = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = ["order_id", "chat", "status", "user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderProductChats).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order Product chat not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Product chat added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderProductChat = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderProductChats.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
  AddProductReview = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "product_name",
        "product_rating",
        "product_review",
        "review_rating",
        "seller_response",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderProductReview).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order Product review not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Product review added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderProductReview = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderProductReview.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
}

module.exports = OrderController;
