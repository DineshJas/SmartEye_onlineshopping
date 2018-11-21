const mongoose=require('mongoose');
const PowerglassSchema=new mongoose.Schema({
	image:String,
	imageId:String,
	name:String,
	price:String,
	description:String
});
module.exports=mongoose.model("PowerGlass",PowerglassSchema);