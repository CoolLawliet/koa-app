const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport')

//引入Profile
const Profile = require('../../models/Profile')

//引入验证
const validateProfileInput = require('../../validation/profile')
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
        const profile = await Profile.find({user: ctx.state.user.id}).populate('user', [
            "name",
            "avatar"
        ])
        if (profile.length > 0) {
            ctx.status = 200;
            ctx.body = profile
        } else {
            ctx.status = 404;
            ctx.body = {noprofile: '该用户没有任何相关的个人信息'}
            return;
        }
    })

/**
 * @route POST api/profile
 * @desc 添加和编辑个人信息接口
 * @access 接口是私密的
 * */
router.post('/',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const {errors,isValid} =validateProfileInput(ctx.request.body);

        //判断是否验证通过
        if (!isValid){
            ctx.status=400;
            ctx.body=errors
            return
        }

        const profileFields = {};

        profileFields.user = ctx.state.user.id;

        if (ctx.request.body.handle) profileFields.handle = ctx.request.body.handle
        if (ctx.request.body.company) profileFields.company = ctx.request.body.company
        if (ctx.request.body.website) profileFields.website = ctx.request.body.website
        if (ctx.request.body.location) profileFields.location = ctx.request.body.location
        if (ctx.request.body.status) profileFields.status = ctx.request.body.status

        //skills数组转换
        if (typeof ctx.request.body.skills !== "undefined") {
            profileFields.skills = ctx.request.body.skills.split(',')
        }

        if (ctx.request.body.bio) profileFields.bio = ctx.request.body.bio
        if (ctx.request.body.githubusername) profileFields.githubusername = ctx.request.body.githubusername

        profileFields.social = {};


        if (ctx.request.body.wechat) profileFields.social.wechat = ctx.request.body.wechat
        if (ctx.request.body.QQ) profileFields.social.QQ = ctx.request.body.QQ
        if (ctx.request.body.tengxunkt) profileFields.social.tengxunkt = ctx.request.body.tengxunkt
        if (ctx.request.body.wangyikt) profileFields.social.wangyikt = ctx.request.body.wangyikt

        //查询数据库
        const profile = await Profile.find({user: ctx.state.user.id});
        if (profile.length > 0) {
            //编辑更新
            const profileUpdate = await Profile.findOneAndUpdate(
                {user: ctx.state.user.id},
                {$set: profileFields},
                {new: true}
            )
            ctx.body = profileUpdate
        } else {
            await new Profile(profileFields).save().then(profile => {
                ctx.status = 200;
                ctx.body = profile
            })
        }
    })
module.exports = router.routes()