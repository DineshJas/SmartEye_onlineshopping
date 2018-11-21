require('dotenv').config();
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user');
const PowerGlass=require('./models/powerglass');
const SunGlass=require("./models/sunglass");
const multer=require('multer');
const cloudinary = require('cloudinary');
const methodOverride =require("method-override");
const async=require('async');
const storage=multer.diskStorage({
	filename:function(res,file,cb){
		cb(null,Date.now()+file.originalname)
	}
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
//image upload setup
var upload = multer({ storage: storage, fileFilter: imageFilter});
//cloudinary configuration
cloudinary.config({ 
  cloud_name: 'sanjai', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect("mongodb://sanjai:sanjai@localhost/smart1?authSource=admin",{ useNewUrlParser: true });
// mongoose.connect("mongodb://sanjai:Sanjai1@ds255262.mlab.com:55262/eyeglass");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname+"/public"));
// console.log(__dirname+"/public");
   //Passport Configuration
app.use(require("express-session")({
    secret: "sanjai",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// user authentication  by passport js
passport.use(new LocalStrategy(User.authenticate()));
// console.log(passport);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.CurrentUser=req.user;
    next();
});

//All glasses
app.get('/',function(req,res){
   let powerGlasses,sunGlasses;
  async.parallel([
      function(cb){
          PowerGlass.find({},function(err,foundPowerGlasses){
           if(err){
           	console.log(err.message);
           }else{
           	// res.render("index",{foundGlasses:foundGlasses});
              powerGlasses=foundPowerGlasses;
              cb();
           }
        }).limit(15);
      },
      function(cb){
          SunGlass.find({},function(err,foundSunGlasses){
              if(err){
                console.log(err.message);
              }else{
                sunGlasses=foundSunGlasses;
                cb();
              }
          }).limit(15); 
      }
    ],function(err){
      if (err) {
        return res.redirect('back');
        // return next(err);
      }
        // console.log("powerglasses:")
        // console.log(powerGlasses);
        // console.log("sunglasses:")
        // console.log(sunGlasses);
          res.render("index",{PowerGlasses:powerGlasses,SunGlasses:sunGlasses});
  });
});
//power glasses only(index powerglass)
app.get("/powerglass",function(req,res){
  PowerGlass.find({},function(err,foundPowerGlasses){
    if (err) {
      console.log(err);
      return res.redirect('back');
    }
    res.render("powerglass/pindex",{foundGlasses:foundPowerGlasses});
  });
});

//particular power glasses
app.get('/powerglass/:id',function(req,res){
  PowerGlass.findById(req.params.id,function(err,foundGlass){
  	// console.log(foundGlass);
    res.render('powerglass/pshow',{foundGlass:foundGlass});
  });
});
//user registeration
app.get('/register',function(req,res){
	res.render("register");
});
app.post('/register',function(req,res){
	var newUser=new User({emailId:req.body.emailId,username:req.body.username,firstname:req.body.firstname,lastname:req.body.lastname});
	  name1=process.env.name1;
	  name2=process.env.name2;
	if(newUser.username===name1 || newUser.username===name2){
		newUser.isAdmin=true;
	}
	User.register(newUser,req.body.password,function(err,user){
		if(err){
          console.log(err);
           return res.redirect("/register");
        }
          passport.authenticate("local")(req, res, function(){
           res.redirect("/");
        });
    });
});
//user login
app.get('/login',function(req,res){
	res.render('login');
});
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}) ,function(req, res){
});
app.get('/logout',function(req,res){
	req.logout();
	res.redirect('/');
	console.log("logged you out")
});
//Admin middleware
function isHeAdmin(req,res,next){
	// console.log(req.user);
 if(req.user && req.user.isAdmin){
 	return next();
 }
 console.log("you must be an admin");
 res.redirect('/login');
}

app.get('/add',isHeAdmin,function(req,res){
	res.render('add');
});
//Get request to add PowerGlass
app.get('/addpowerglass',isHeAdmin,function(req,res){
    res.render('powerglass/pnew');
});
app.post('/addpowerglass',isHeAdmin,upload.single('image'),function(req,res){
	cloudinary.v2.uploader.upload(req.file.path, function(err,result) {
	    if(err){
	           console.log(err.message);
	           return res.redirect('back');
	    }

	  // add cloudinary url for the image to the campground object under image property
	  req.body.pglass.image = result.secure_url;
	  req.body.pglass.imageId = result.public_id;
	  // console.log(req.body.pglass.image+" "+req.body.pglass.imageId);
	  // add author to campground
	  PowerGlass.create(req.body.pglass, function(err, addedglass) {
	    if (err) {
	      consloe.log(err.message);
	      return res.redirect('back');
	    }
	    // console.log(addedglass);
	    res.redirect('/add');
	  });
	});
});
//powerglass edit:
  //get request
app.get('/powerglass/:id/edit',isHeAdmin,function(req,res){
  // console.log(req.params.id);
  PowerGlass.findById(req.params.id,function(err,foundGlass){
  	if(err){
  		console.log("requested powerglass couldn't be found");
  	}else{

  	}
    res.render('powerglass/pedit',{foundGlass:foundGlass});
  });
});
 //update request:
app.put("/powerglass/:id",isHeAdmin,upload.single('image'),function(req,res){
  PowerGlass.findById(req.params.id, async function(err, foundGlass){
        if(err){
            console.log(err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(foundGlass.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  foundGlass.imageId = result.public_id;
                  foundGlass.image = result.secure_url;
              } catch(err) {
                  console.log(err);
                  return res.redirect("back");
              }
            }
            foundGlass.name = req.body.pglass.name;
            foundGlass.price= req.body.pglass.price;
            foundGlass.description = req.body.pglass.description;
            foundGlass.save();
            res.redirect("/powerglass/" + foundGlass._id);
        }
    });
});


//powerglass delete
app.delete('/powerglass/:id',isHeAdmin,function(req,res){
	PowerGlass.findById(req.params.id,async function(err,foundGlass){
	   if(err){
	   	return res.redirect('back');
	   }
	   try{
	      await cloudinary.v2.uploader.destroy(foundGlass.imageId);
	      foundGlass.remove();
	      res.redirect('/');
	   }catch(err){
	      if (err) {
	      	return res.redirect('back');
	      }
	   }
	});
});


//SunGlasses
//get Route for sunglass:
app.get("/addsunglass",isHeAdmin,function(req,res){
res.render("sunglass/snew");
});

//post Route for adding sunglass:
app.post("/addsunglass",isHeAdmin,upload.single('image'),function(req,res){
  cloudinary.v2.uploader.upload(req.file.path,function(err,result){
    if(err){
      console.log(err.message);
      return res.redirect('back');
    }
    req.body.sglass.image=result.secure_url;
    req.body.sglass.imageId=result.public_id;
    SunGlass.create(req.body.sglass,function(err,addedglass){
      if (err) {
        console.log(err);
        return res.redirect('back');
      }
      res.redirect('/add');
    });
  });
});

//route to get sunglasses only(index sunglass page)
app.get("/sunglass",function(req,res){
   SunGlass.find({},function(err,foundSunGlasses){
      if (err) {
        console.log(err);
      }else{
        res.render("sunglass/sindex",{foundGlasses:foundSunGlasses});
      }

   });
});

//route to show particular sunglass
app.get('/sunglass/:id',function(req,res){
  SunGlass.findById(req.params.id,function(err,foundGlass){
    // console.log(foundGlass);
    res.render('sunglass/sshow',{foundGlass:foundGlass});
  });
});

//sunglass edit:
  //get request
app.get('/sunglass/:id/edit',isHeAdmin,function(req,res){
  // console.log(req.params.id);
  SunGlass.findById(req.params.id,function(err,foundGlass){
    if(err){
      console.log("requested powerglass couldn't be found");
    }else{

    }
    res.render('sunglass/sedit',{foundGlass:foundGlass});
  });
});
 //update request:
app.put("/sunglass/:id",isHeAdmin,upload.single('image'),function(req,res){
  SunGlass.findById(req.params.id, async function(err, foundGlass){
        if(err){
            console.log(err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(foundGlass.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  foundGlass.imageId = result.public_id;
                  foundGlass.image = result.secure_url;
              } catch(err) {
                  console.log(err);
                  return res.redirect("back");
              }
            }
            foundGlass.name = req.body.sglass.name;
            foundGlass.price= req.body.sglass.price;
            foundGlass.description = req.body.sglass.description;
            foundGlass.save();
            res.redirect("/sunglass/" + foundGlass._id);
        }
    });
});


//powerglass delete
app.delete('/sunglass/:id',isHeAdmin,function(req,res){
  SunGlass.findById(req.params.id,async function(err,foundGlass){
     if(err){
      return res.redirect('back');
     }
     try{
        await cloudinary.v2.uploader.destroy(foundGlass.imageId);
        foundGlass.remove();
        res.redirect('/');
     }catch(err){
        if (err) {
          return res.redirect('back');
        }
     }
  });
});
// app.listen(process.env.PORT,process.env.IP);
app.listen(3001,function(){
	console.log('server started at localhost:3001/');
});