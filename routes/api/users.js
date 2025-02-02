const Router = require('koa-router');
const router = new Router();
const tools = require('../../config/tools')
const keys = require('../../config/keys')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('koa-passport')

//引入User
const User = require('../../models/User')

//引入验证
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')
/**
 * @route GET api/users/test
 * @desc 测试接口
 * @access 接口是公开的
 * */
router.get('/test', async ctx => {
    ctx.status = 200;
    ctx.body = {msg: "users works..."};
});

/**
 * @route POST api/users/register
 * @desc 注册接口
 * @access 接口是公开的
 * */
router.post('/register', async ctx => {

    const {errors,isValid} =validateRegisterInput(ctx.request.body);

    //判断是否验证通过
    if (!isValid){
        ctx.status=400;
        ctx.body=errors
        return
    }
    //存储到数据库
    const findResult = await User.find({email: ctx.request.body.email});
    if (findResult.length > 0) {
        ctx.status = 500;
        ctx.body = {email: '邮箱已被占用'};
    } else {
        const avatar = gravatar.url(ctx.request.body.email, {s: '200', r: 'pg', d: 'mm'});
        const newUser = new User({
            name: ctx.request.body.name,
            email: ctx.request.body.email,
            avatar,
            password: tools.enbcrypt(ctx.request.body.password),
        });

        //存储到数据库
        await newUser.save().then(user => {
            ctx.body = user;
        }).catch(err => {
            console.log(err);
        });

        //返回json数据
        ctx.body = newUser
    }
});

/**
 * @route POST api/users/login
 * @desc 登录接口
 * @access 接口是公开的
 * */
router.post('/login', async ctx => {
    const {errors,isValid} =validateLoginInput(ctx.request.body);

    //判断是否验证通过
    if (!isValid){
        ctx.status=400;
        ctx.body=errors
        return
    }
    //查询
    const findResult = await User.find({email: ctx.request.body.email});
    const user = findResult[0]
    const password = ctx.request.body.password

    //判断
    if (findResult.length === 0) {
        ctx.status = 404;
        ctx.body = {email: "用户不存在"}
    } else {
        //验证密码
        var result = await bcrypt.compareSync(password, user.password);//true

        //验证通过
        if (result) {
            //返回token
            const payload = {id: user.id, name: user.name, avatar: user.avatar};
            const token = jwt.sign(payload, keys.secretOrKey, {expiresIn: 3600*6*24*7});
            ctx.status = 200;
            ctx.body = {success: true, token: "Bearer " + token};
        } else {
            ctx.status = 400;
            ctx.body = {password: '密码错误'};
        }
    }
})

/**
 * @route GET api/users/current
 * @desc 用户信息接口 返回用户信息
 * @access 接口是私密的
 * */
router.get('/current',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        ctx.body = {
            id:ctx.state.user.id,
            name:ctx.state.user.name,
            email:ctx.state.user.email,
            avatar:ctx.state.user.avatar
        }
    })

module.exports = router.routes()