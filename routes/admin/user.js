const AdminUserController = require('../../controller/admin/users');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/admin-users-all', Authorization.isAdminAuthorised, (req, res, next) => {
        const userObj = (new AdminUserController()).boot(req, res);
        return userObj.getAllUsers();
    });

    router.get('/admin-users-all-withBankDetails', Authorization.isAdminAuthorised, (req, res, next) => {
        const userObj = (new AdminUserController()).boot(req, res);
        return userObj.getAllUsersWithBankDetails();
    });

    router.get('/admintest', Authorization.isAdminAuthorised, (req, res, next) => {
        const userObj = (new AdminUserController()).boot(req, res);
        return userObj.getAllUsersWithALLDetails();
    });

}