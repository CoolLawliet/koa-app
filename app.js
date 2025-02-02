const koa = require('koa');
const Router = require('koa-router');
const mongoose = require('mongoose');
const bodyParser = require('koa-bodyparser');
const passport = require('koa-passport');

//实例化koa‘
const app = new koa();
const router = new Router();

app.use(bodyParser());

//引入users.js
const users = require('./routes/api/users')
const profile = require('./routes/api/profile')
const posts = require('./routes/api/posts')

//路由
router.get('/', async ctx => {
    ctx.body = {msg: 'Hello Koa Interfaces'}
});

//config
const db=require('./config/keys').mongoURI

//连接数据库
mongoose.connect(
    db, {
    useNewUrlParser: true
})
    .then(() => {
        console.log('Mongodb Connected...');
    }).catch(err => {
    console.log(err);
})

app.use(passport.initialize());
app.use(passport.session())

//回调到config中passport.js
require('./config/passport')(passport);

//配置路由地址
router.use('/api/users',users)
router.use('/api/profile',profile)
router.use('/api/posts',posts)

//配置路由
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`server started on ${port}`);
});