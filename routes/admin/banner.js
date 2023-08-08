const BannerController = require('../../controller/admin/adBanner');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/banner', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new BannerController()).boot(req, res);
        return attributeObj.addBnners();
    });
    router.get('/admin/banner', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new BannerController()).boot(req, res);
        return attributeObj.getBanner();
    });

    router.get('/admin/getAttributeDetails/:attributeId', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new AttributesController()).boot(req, res);
        return attributeObj.getAttributeDetails();
    });

    router.post('/admin/changeStatusOfAttributes', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new AttributesController()).boot(req, res);
        return attributeObj.changeStatusOfAttributes();
    });

    router.post('/admin/deleteAttributes', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new AttributesController()).boot(req, res);
        return attributeObj.deleteAttributes();
    });

    router.post('/admin/attributesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new AttributesController()).boot(req, res);
        return attributeObj.attributesListing();
    });

    router.post('/admin/downloadAttributeFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const attributeObj = (new AttributesController()).boot(req, res);
        return attributeObj.downloadAttributeFiles();
    });
}