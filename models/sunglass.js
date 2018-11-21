const mongoose=require('mongoose');
const SunglassSchema=new mongoose.Schema({
	image:String,
	imageId:String,
	name:String,
	price:String,
	description:String
});
module.exports=mongoose.model("SunGlass",SunglassSchema);