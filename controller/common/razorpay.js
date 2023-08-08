/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Razorpay = require("razorpay");
class RazorpayController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
  }

  /*
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt#1",
  "notes": {
   order_id:kandngfadglda
  }
}
  */
  createRazorpayOrder = async () => {
    try {
      let payload = this.req.body;
      let rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY, // your `KEY_ID`
        key_secret: process.env.RAZORPAY_SECRET, // your `KEY_SECRET`
      });

      const order = await rzp.orders.create(payload);
      if (_.isEmpty(order)) {
        return this.res.send({
          status: 0,
          message: "razorpay create order failed",
        });
      }
      return this.res.send({ status: 1, data: order });
    } catch (error) {
      console.error("error creating razorpay order", error);
      this.res
        .status(500)
        .send({ status: 0, message: error.message, data: error });
    }
  };
}

module.exports = RazorpayController;
