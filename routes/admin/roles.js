const RolesController = require('../../controller/admin/roles');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateDepartment', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.addAndUpdateDepartment();
    });

    router.get('/admin/getDepartmentDetails/:departmentId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.getDepartmentDetails();
    });

    router.post('/admin/changeStatusOfDepartments', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.changeStatusOfDepartments();
    });

    router.post('/admin/deleteDepartments', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.deleteDepartments();
    });

    router.post('/admin/departmentsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.departmentsListing();
    });

    router.post('/admin/downloadDepartmentFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.downloadDepartmentFiles();
    });

    router.post('/admin/departmentsFieldsList', (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.departmentsFieldsList();
    });

    router.post('/admin/addAndUpdatePermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.addAndUpdatePermissions();
    });

    router.get('/admin/getPermissionDetails/:permissionId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.getPermissionDetails();
    });

    router.post('/admin/changeStatusOfPermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.changeStatusOfPermissions();
    });

    router.post('/admin/deletePermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.deletePermissions();
    });

    router.post('/admin/permissionsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.permissionsListing();
    });

    router.post('/admin/downloadPermissionFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.downloadPermissionFiles();
    });

    router.post('/admin/permissionFieldsList', (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.permissionFieldsList();
    });

    router.get('/admin/getAllPermissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.getAllPermissions();
    });

    router.post('/admin/addAndUpdateRole', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.addAndUpdateRole();
    });

    router.get('/admin/getRoleDetails/:roleId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.getRoleDetails();
    });

    router.post('/admin/changeStatusOfRoles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.changeStatusOfRoles();
    });

    router.post('/admin/deleteRoles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.deleteRoles();
    });

    router.post('/admin/rolesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.rolesListing();
    });

    router.post('/admin/downloadRoleFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.downloadRoleFiles();
    });

    router.post('/admin/rolesFieldsList', (req, res, next) => {
        const rechargeObj = (new RolesController()).boot(req, res);
        return rechargeObj.rolesFieldsList();
    });
}