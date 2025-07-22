const nodemailer = require('nodemailer');
const connection = require('../../config/db');
const CategoriesController = require("../../controller/admin/categories");
const Authorization = require('../../middleware/auth');
module.exports = (router, app) => {  
  router.post('/addCategory', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.addCategory();
  });
  router.post('/addSubCategory', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.addSubCategory();
  });
  router.post('/subcategoryListing', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.subcategoryList();
  });
  router.post('/deleteCategories', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.deleteCategories();
  });
  router.post('/getCategoriesDetails', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.getCategoriesDetails();
  });
  router.post('/changeCategoryStatus', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.changeCategoryStatus();
  });
  router.post('/categoryListing', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.categoryListing();
  });
  router.get('/categoryList', (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.categoryList();
  });
   router.get('/subcategoryList', (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.subcategoryList();
  });

  router.get('/getParentCategoryName/:categoryId', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.getParentCategoryName();
  });

  router.delete('/deleteCategoryImage/:categoryId', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.deleteCategoryImage();
  });

  router.post('/catLevels', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.catLevels();
  });

  router.post('/downloadCategoriesFile', Authorization.isAdminAuthorised, (req, res, next) => {
    const categoryObj = (new CategoriesController()).boot(req, res);
    return categoryObj.downloadCategoriesFile();
  });
}