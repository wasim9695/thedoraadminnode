const TeamProductsController = require('../../controller/admin/teamProducts');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addAndUpdateTeamProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.addAndUpdateTeamProduct();
    });

    router.get('/getTeamProductDetails/:teamProductId', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.getTeamProductDetails();
    });
    router.get('/getTeamProductDetailsAll', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.getTeamProductDetailsAll();
    });

    router.post('/teamProductsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.teamProductsListing();
    });

    router.post('/deleteTeamProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.deleteTeamProducts();
    });

    router.post('/downloadTeamProductFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const teamProductObj = (new TeamProductsController()).boot(req, res);
        return teamProductObj.downloadTeamProductFiles();
    });

}