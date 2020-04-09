const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport')

//引入Post
const Post = require('../../models/Post')
//引入验证
const validatePostInput = require('../../validation/post')
/**
 * @route GET api/posts/test
 * @desc 测试接口
 * @access 接口是公开的
 * */
router.get('/test', async ctx => {
    ctx.status = 200;
    ctx.body = {msg: "posts works..."};
});

/**
 * @route POST api/posts
 * @desc 评论接口
 * @access 接口是公开的
 * */
router.post('/',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const {errors, isValid} = validatePostInput(ctx.request.body);

        //判断是否验证通过
        if (!isValid) {
            ctx.status = 400;
            ctx.body = errors
            return
        }
    const newPost = new Post({
        text:ctx.request.body.text,
        name:ctx.request.body.name,
        avatar:ctx.request.body.avatar,
        user:ctx.state.user.id,
    })

        await newPost
            .save()
            .then(post=>ctx.body=post)
            .catch(err=>ctx.body=err);

    ctx.body=newPost;

    });

module.exports = router.routes()