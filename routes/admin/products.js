const ProductController = require('../../controller/admin/product');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/seller/getDefaultValuesOfProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.getDefaultValuesOfProduct();
    });

    router.post('/admin/addAndUpdateProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.addAndUpdateProduct();
    });

    router.get('/admin/getProductList', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.getProductLists();
    });
    router.get('/admin/getProductLists/:catID', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.getProductListByID();
    });
    router.get('/admin/getProductListsDetail/:productId', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.getProductListByDetail();
    });

    router.post('/seller/changeStatusOfProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.changeStatusOfProducts();
    });

    router.post('/seller/deleteProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.deleteProducts();
    });

    router.post('/seller/productsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.productsListing();
    });

    router.post('/seller/downloadProductFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.downloadProductFiles();
    });

    router.post('/seller/deleteRelatedProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.deleteRelatedProduct();
    });

    router.post('/seller/relatedProductsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.relatedProductsListing();
    });

    router.post('/seller/deleteAdditionalGallaryImages', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.deleteAdditionalGallaryImages();
    });

    router.delete('/seller/deleteProductImage/:productId', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.deleteProductImage();
    });

    router.post('/productFieldsList', (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.productFieldsList();
    });

    router.post('/admin/updateProductDetailsByAdmin', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.updateProductDetailsByAdmin();
    });

    router.post('/admin/changeStatusOfProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.changeStatusOfProducts();
    });

    router.post('/admin/deleteProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.deleteProducts();
    });

    router.post('/admin/productsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.productsListing();
    });

    router.post('/admin/downloadProductFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const productObj = (new ProductController()).boot(req, res);
        return productObj.downloadProductFiles();
    });
}