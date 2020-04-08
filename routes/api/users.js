const Router = require('koa-router');
const router = new Router();

/**
* @route GET api/users/test
 * @desc 测试接口
 * @access 接口是公开的
* */
router.get('/test',async ctx=>{
    ctx.status=200;
    ctx.body = {msg:"users works..."};
});

module.exports = router.routes()