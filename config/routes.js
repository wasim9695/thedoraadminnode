module.exports = (router, app) => {
    // Admin Routes
    require('../routes/user/index')(router, app);
    require('../routes/common/fileUpload')(router, app);
    require('../routes/admin/auth')(router, app);
    require('../routes/admin/categories')(router, app);
    require('../routes/admin/attributes')(router, app);
    require('../routes/admin/products')(router, app);
    require('../routes/user/cart')(router, app);
    require('../routes/user/orders')(router, app);
    require('../routes/common/categories')(router, app);
    require('../routes/admin/banner')(router, app);
    require('../routes/common/banner')(router, app);
    require('../routes/common/allProducts')(router, app);
};