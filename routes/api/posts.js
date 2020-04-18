const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport')

//引入Post
const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
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
 * @desc 创建评论接口
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
            text: ctx.request.body.text,
            name: ctx.request.body.name,
            avatar: ctx.request.body.avatar,
            user: ctx.state.user.id,
        })

        await newPost
            .save()
            .then(post => ctx.body = post)
            .catch(err => ctx.body = err);

        ctx.body = newPost;

    });

/**
 * @route GET api/posts/all
 * @desc 获取所有评论接口
 * @access 接口是公开的
 * */
router.get('/all', async ctx => {
    await Post.find().sort({data:-1}).then(posts=>{
        ctx.status = 200;
        ctx.body = posts
    })
        .catch(err=>{
            ctx.status = 200;
            ctx.body = {nopostsfound:'找不到任何留言信息'}
        })
});

/**
 * @route GET api/posts?id=xxxxxxx
 * @desc 获取单个留言接口
 * @access 接口是公开的
 * */
router.get('/', async ctx => {
   const id=ctx.query.id;
   await Post.findById(id).then(post=>{
       ctx.status = 200;
       ctx.body = post
   }).catch(err=>{
       ctx.status = 200;
       ctx.body = {nopostfound:'没有留言信息'}
   })
});

/**
 * @route DELETE api/posts?id=xxxxxxx
 * @desc 删除单个留言接口
 * @access 接口是公开的
 * */
router.delete('/',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const id=ctx.query.id;
        //当前用户是否拥有个人信息
        const profile = await Profile.find({user:ctx.state.user.id})
        if (profile.length>0){
            //查找此人留言
            const post = await Post.findById(id);

            //判断是不是当前用户操作
            if (post.user.toString()!==ctx.state.user.id){
                ctx.status = 401;
                ctx.body = {notauthorized:'用户非法操作'};
                return
            }
            await Post.remove({_id:id}).then(()=>{
                ctx.status = 200;
                ctx.body = {success:true}
            })
        }else {
            ctx.status = 404;
            ctx.body = {error:'个人信息不存在'}
        }
    });

/**
 * @route POST api/posts/like?id=xxxxxxxxxx
 * @desc 点赞接口
 * @access 接口是私有的
 * */
router.post('/like',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const id=ctx.query.id;

        //查询用户信息
        const profile = await Profile.find({user:ctx.state.user.id})
        if (profile.length>0){
            const post = await Post.findById(id);
            const isLike=post.likes.filter(like=>like.user.toString()===ctx.state.user.id).length>0;
            if (isLike){
                ctx.status = 400;
                ctx.body = {alerdyliked:'该用户已赞过'}
                return
            }
            post.likes.unshift({user:ctx.state.user.id})

            const postUpdate = await Post.findOneAndUpdate(
                {_id:id},
                {$set:post},
                {new:true}
                )
            ctx.body = postUpdate
        }else {
            ctx.status = 404;
            ctx.body = {error:'profile不存在'}
        }
    });

/**
 * @route POST api/posts/unlike?id=xxxxxxxxxx
 * @desc 取消点赞接口
 * @access 接口是私有的
 * */
router.post('/unlike',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const id=ctx.query.id;

        //查询用户信息
        const profile = await Profile.find({user:ctx.state.user.id})
        if (profile.length>0){
            const post = await Post.findById(id);
            const isLike=post.likes.filter(like=>like.user.toString()===ctx.state.user.id).length===0;
            if (isLike){
                ctx.status = 400;
                ctx.body = {alerdyliked:'该用户没有点赞过'}
                return
            }
             //获取要删掉的user id
            const removeIndex = post.likes
                .map(item=>item.user.toString())
                .indexOf(id)

            post.likes.splice(removeIndex,1);

            const postUpdate = await Post.findByIdAndUpdate(
                {_id:id},
                {$set:post},
                {new:true}
            )
            ctx.body = postUpdate
        }else {
            ctx.status = 404;
            ctx.body = {error:'profile不存在'}
        }
    });

/**
 * @route POST api/posts/comment?id=xxxxxxxxxx
 * @desc 留言接口
 * @access 接口是私有的
 * */
router.post('/comment',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const id=ctx.query.id;
        const post = await Post.findById(id);
        const newComment ={
            text:ctx.request.body.text,
            name:ctx.request.body.name,
            avatar:ctx.request.body.avatar,
            user:ctx.request.body.user,
        }

        post.comments.unshift(newComment);
        const postUpdate = await Post.findOneAndUpdate(
            {_id:id},
            {$set:post},
            {new:true}
        )
        ctx.body = postUpdate
    });

/**
 * @route DELETE api/posts/comment?id=xxxxxxxxxx&comment_id=xxxxxxx
 * @desc 删除评论接口
 * @access 接口是私有的
 * */
router.delete('/comment',
    passport.authenticate('jwt', {session: false}),
    async ctx => {
        const id=ctx.query.id;
        const comment_id = ctx.query.comment_id;

        const post = await Post.findById(id);
        const isComment = post.comments.filter(comment=>comment_id.toString()===comment_id).length===0
        if (isComment){
            ctx.status=400;
            ctx.body={commentnotexists:'该评论不存在'}
            return
        }

        //找到评论信息
        const removeIndex = post.comments
            .map(item=>item.id.toString())
            .indexOf(comment_id)
        post.comments.splice(removeIndex,1);
        const postUpdate = await Post.findByIdAndUpdate(
            {_id:id},
            {$set:post},
            {new:true}
        )
        ctx.body = postUpdate
    });
module.exports = router.routes()