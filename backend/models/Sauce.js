const mongoose = require('mongoose');

const sauceSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  manufacturer:{ type: String, required: true },
  imageUrl: { type: String, required: true },
  userId: { type: String, required: true },
  mainPepper:{type:String,require:true},
  heat :{type:Number,require:true},
  likes :{type:Number,default:0,require:true},
  dislikes :{type:Number,default:0,require:true},
  usersLiked :{type:[String],require:true},
  usersDisliked:{type:[String],require:true},
});

module.exports = mongoose.model('sauce', sauceSchema);