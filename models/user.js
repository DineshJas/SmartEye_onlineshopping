const mongoose=require('mongoose');
const passportLocalMongoose  = require("passport-local-mongoose");
var UserSchema=new mongoose.Schema({
   emailId:String,
   username:String,
   password:String,
   firstname:String,
   lastname:String,
   isAdmin:{type:Boolean,default:false}
});
UserSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",UserSchema);