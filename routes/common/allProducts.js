const ProductsController = require('../../controller/admin/product');

module.exports = (router, app) => {
    router.get('/getNewArrival', (req, res, next) => {
        const categoryObj = (new ProductsController()).boot(req, res);
        return categoryObj.getNewArrivals();
    });

    router.get('/getBestSeller', (req, res, next) => {
        const categoryObj = (new ProductsController()).boot(req, res);
        return categoryObj.getBestSellers();
    });


    router.get('/getFeatured', (req, res, next) => {
        const categoryObj = (new ProductsController()).boot(req, res);
        return categoryObj.getFeatured();
    });
    router.get('/getTodayDeal', (req, res, next) => {
        const categoryObj = (new ProductsController()).boot(req, res);
        return categoryObj.getTodayDeal();
    });
     router.get('/getfastival', (req, res, next) => {
        const categoryObj = (new ProductsController()).boot(req, res);
        return categoryObj.getFastival();
    });

      router.get('/getProductLists/:catID', (req, res, next) => {
        const productObj = (new ProductsController()).boot(req, res);
        return productObj.getProductListByID();
    });

       router.get('/getProductList', (req, res, next) => {
        const productObj = (new ProductsController()).boot(req, res);
        return productObj.getProductLists();
    });
        router.get('/getProductListDetail/:productId', (req, res, next) => {
        const productObj = (new ProductsController()).boot(req, res);
        return productObj.getProductListByDetail();
    });

       

    // router.post('/common/subgetCategories', (req, res, next) => {
    //     const categoryObj = (new CategoriesController()).boot(req, res);
    //     return categoryObj.getSubCategories();
    // });
}