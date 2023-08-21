const CartController = require('../../controller/user/cart');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/addToCart', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.addToCart();
    });

    router.post('/bulkupdate', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.updateAddToCart();
    });
    router.post('/singleupdate', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.updateAddToCartSingle();
    });

    router.post('/saveForLater', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.saveForLater();
    });

    router.post('/deleteCartProducts', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.deleteCartProducts();
    });

    router.get('/getCartDetails', Authorization.isAuthorised, (req, res, next) => {
        const cartObj = (new CartController()).boot(req, res);
        return cartObj.getCartDetails();
    });

    router.post("/orderSummary", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new CartController().boot(req, res);
        return orderObj.getOrderSummary();
    });
}