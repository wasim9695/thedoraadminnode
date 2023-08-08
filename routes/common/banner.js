const BannerController = require('../../controller/admin/adBanner');

module.exports = (router, app) => {
    router.get('/common/banner', (req, res, next) => {
        const bannerObj = (new BannerController()).boot(req, res);
        return bannerObj.getBanner();
    });
    router.get('/common/leftbanner', (req, res, next) => {
        const bannerObj = (new BannerController()).boot(req, res);
        return bannerObj.getBannerLeftSideBanner();
    });
    router.get('/common/rightbanner', (req, res, next) => {
        const bannerObj = (new BannerController()).boot(req, res);
        return bannerObj.getBannerRightSideBanner();
    });
     router.get('/common/bottombanner', (req, res, next) => {
        const bannerObj = (new BannerController()).boot(req, res);
        return bannerObj.getBannerBottom();
    });
  
}