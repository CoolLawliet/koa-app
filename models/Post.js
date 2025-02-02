const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//实例化数据模板
const PostSchema = new Schema({
    user: {//关联数据表
        type: String,
        ref: 'users',
        required: true
    },
    text:{
        type:String,
        required:true
    },
    name:{
        type: String
    },
    avatar:{
        type: String,
    },
    likes:[
        {
            user:{
                type:Schema.Types.ObjectId,
                ref:'user'
            }
        }
    ],
    comments:[
        {
            user:{
                type:Schema.Types.ObjectId,
                ref:'user'
            },
            text:{
                type: String,
                required: true
            },
            name:{
                type: String,
                required: true
            },
            avatar:{
                type: String,
            },
            date:{
                type:Date,
                default:Date.now()
            }
        }
    ],
    date:{
        type:Date,
        default:Date.now()
    }
});

module.exports = Post = mongoose.model('post',PostSchema);