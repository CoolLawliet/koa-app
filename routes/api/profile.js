const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport')

//引入Profile
const Profile = require('../../models/Profile')
/**
 * @route GET api/profile/test
 * @desc 测试接口
 * @access 接口是公开的
 * */
router.get('/test', async ctx => {
    ctx.status = 200;
    ctx.body = {msg: "profile works..."};
});

/**
 * @route GET api/profile
 * @desc 个人信息接口
 * @access 接口是私密的
 * */
router.get('/',
    passport.authenticate('jwt', {session: false}),
    async ctx => {

    })
module.exports = router.routes()