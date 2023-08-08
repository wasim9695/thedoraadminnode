const nodemailer = require('nodemailer');
const connection = require('../../config/db');
const UsersController = require("../../controller/user/authentication");
const Authorization = require('../../middleware/auth');
module.exports = (router, app) => {       
  router.post("/signUp", (req, res, next) => {
    const authObj = new UsersController().boot(req, res);
    return authObj.signUp();
  });
  router.post("/signIn", (req, res, next) => {
    const authObj = new UsersController().boot(req, res);
    return authObj.signIn();
  });
  router.get(
    "/getUserProfile",
    Authorization.isAuthorised,
    (req, res, next) => {
      const userObj = new UsersController().boot(req, res);
      return userObj.getUserProfile();
    },
  );

  router.post(
    "/editUserProfile",
    Authorization.isAuthorised,
    (req, res, next) => {
      const userObj = new UsersController().boot(req, res);
      return userObj.editUserProfile();
    },
  );

  router.post(
    "/users/addresses",
    Authorization.isAuthorised,
    (req, res, next) => {
      const userObj = new UsersController().boot(req, res);
      return userObj.userAddresses();
    },
  );

  router.put(
    "/users/addresses/:addressId",
    Authorization.isAuthorised,
    (req, res, next) => {
      const userObj = new UsersController().boot(req, res);
      return userObj.userAddressesUpdate();
    },
  );

  router.delete(
    "/users/delete/:addressId",
    Authorization.isAuthorised,
    (req, res, next) => {
      const userObj = new UsersController().boot(req, res);
      return userObj.userAddressesDelete();
    },
  );

  router.post("/forgotPassword", (req, res, next) => {
    const authObj = new UsersController().boot(req, res);
    return authObj.userForgetPassoord();
  });
  router.post("/changePassword", (req, res, next) => {
    const authObj = new UsersController().boot(req, res);
    return authObj.userPassowrdChanage();
  });
 


}
