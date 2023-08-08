/** @format */

const RazorpayController = require("../../controller/common/razorpay");
const Authorization = require("../../middleware/auth");
module.exports = (router, app) => {
  router.post(
    "/common/createOrder",
    Authorization.isAuthorised,
    (req, res, next) => {
      const razorPayObj = new RazorpayController().boot(req, res);
      return razorPayObj.createRazorpayOrder();
    },
  );
};
