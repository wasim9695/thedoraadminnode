const CategoriesController = require('../../controller/common/categories');

module.exports = (router, app) => {
    router.get('/common/getCategories', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.getCategories();
    });
    router.post('/common/subgetCategories', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.getSubCategories();
    });
     router.get('/common/subgetAllCategories', (req, res, next) => {
        const categoryObj = (new CategoriesController()).boot(req, res);
        return categoryObj.getSubCategoriesDefoult();
    });

    
}