const express = require('express');
const router = express.Router();
const userModel = require("./users");
const productModel = require("./products");
const passport = require("passport");
const config = require("../config/config");
const multer = require('multer');
const localStrategy = require("passport-local");
const path = require("path");
const crypto = require("crypto");
const products = require('./products');
// const { name } = require('ejs');
// const { use } = require('passport');
const mailer = require("../config/ndmlr");
require('dotenv').config();
const  GoogleStrategy= require("passport-google-oidc");







// const upload = multer({ storage: config.storage });

const userImages = multer({ storage: config.userimages })
const productImages = multer({ storage:config.productimage})



passport.use(new localStrategy(userModel.authenticate()));


const Razorpay = require("razorpay");

var instance = new Razorpay({
  // key_id: 'rzp_test_9ftocVh70BuBgl',
  key_id: 'rzp_test_ggIzqO7dmoHKDY',
  // key_secret: '4VrlkfbadgRlOD5Cxf1mdcb7',
  key_secret: 'CWwYFF0Obg4Am2xGXiQkdwdF',

});

router.post('/create/orderId/:id', async function(req, res) {
  let product = await productModel.findOne({_id:req.params.id});

  var options = {
      amount: product.price*100,  // amount in the smallest currency unit
      currency: "INR",
      receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function(err, order) {
      console.log(`this is ordrrr : ${order.id}`);
      console.log(order);

      res.send(order);
    });

});

router.post("/api/payment/verify",(req,res)=>{

  let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

   var crypto = require("crypto");
   var expectedSignature = crypto.createHmac('sha256', '4VrlkfbadgRlOD5Cxf1mdcb7')
                                   .update(body.toString())
                                   .digest('hex');
                                   console.log("sig received " ,req.body.response.razorpay_signature);
                                   console.log("sig generated " ,expectedSignature);
   var response = {"signatureIsValid":"false"}
   if(expectedSignature === req.body.response.razorpay_signature)
    response={"signatureIsValid":"true"}
       res.send(response);
       
       
});

 




router.get('/login/federated/google', passport.authenticate('google'));



passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: ['email','profile' ]
}, function verify(issuer, profile, cb) {
  userModel.findOne({email:profile.emails[0].value}).then(function(user){
    if(user){
      return cb(null,user);
    }
    else{
      userModel.create({
        name:profile.displayName,
        email:profile.emails[0].value
      })
    }

  })
 
}));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));








/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.post("/register",function(req,res){
  var userDetail = new userModel({
    name:req.body.name,
    username:req.body.username,
    email:req.body.email,
    contactNo:req.body.contactNo,
    isseller:req.body.isseller

  })

  userModel.register(userDetail,req.body.password).then(function(){
    passport.authenticate('local')(req,res,function(){
      // res.redirect("/profile");
      res.redirect("login");
    })
  })
})

router.get("/find",function(req,res){
  userModel.find().then(function(allusers){
    res.send(allusers);
  })
})




router.get("/login",isRedirected,function(req,res){
  res.render("login");
})
router.get("/register",isRedirected,function(req,res){
  res.render("register");
})


router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', async function(req, res) {
  var user = await userModel.findOne({email:req.body.email});
  if(user){
    
    crypto.randomBytes(20, async function(err,buff){
      var otpstr = buff.toString("hex");
      user.otp = otpstr;
      await user.save();
      mailer(user._id,req.body.email,otpstr);
    })
  }
  else{
    res.send("forgot");
  }


});


router.get('/forgot/:id/otp/:otp', async function(req, res) {
  let user = await userModel.findOne({_id:req.params.id});
  if(user.otp===req.params.otp){
    res.render("reset",{id:req.params.id});
  }
  else{
    res.send("Somethig went wrong..!!");

  }
});

router.post('/reset/:id', async function(req, res) {
  let user = await userModel.findOne({_id:req.params.id});
  user.setPassword(req.body.newPassword,function(){
    user.otp="";
    user.save();
    res.redirect("/login");
  })
});



router.post('/login',passport.authenticate('local',{
  successRedirect:"/profile",
  failureRedirect:"/register",

}),function(req,res){});



router.get("/logout",function(req,res,next){
  req.logOut(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  });
});


router.get("/profile", async function(req,res){
  let user = await userModel.findOne({username:req.session.passport.user}).populate("products");
  let verified = true;
  let ans = user.toJSON();
  var ignore = ["products","wishlist","otp"];

  for(let abc in ans){
    if(ignore.indexOf(abc)===-1 && ans[abc].length===0) verified = false;
  }

  res.render("profile",{user,verified});
  // console.log(verified);
})

router.get("/verify",async function(req,res){
  let user = await userModel.findOne({username:req.session.passport.user})
  res.render("verify",{user});
})


router.post("/verify",async function(req,res){
  var data = {
    contactNo:req.body.contactNo,
    gsti:req.body.gsti,
    address:req.body.address,
    name:req.body.name,
    username:req.body.username,
    email:req.body.email,
  }
  let verifiedUser = await userModel.findOneAndUpdate({username:req.session.passport.user},data);
  res.redirect("/profile");
})

router.get("/image",function(req,res){
  res.render("image");
})

router.post("/upload",userImages.single("pic"), async function(req,res){
  let user = await userModel.findOne({username:req.session.passport.user})
  user.pic = req.file.filename;
  await user.save()
   res.redirect("/profile");
   
})


router.get("/create/product",isLoggedIn,function(req,res){
  res.send("show a form for create productss..!!");
})


router.post("/create/product", isLoggedIn,productImages.array("pic",3),async function(req,res){
  let createdUser = await userModel.findOne({username:req.session.passport.user});
  if(createdUser.isseller){
    var data = {
      productname:req.body.productname,
      pic:req.files.map(elm => elm.filename),
      // pic:req.file.filename,
      sellerid:createdUser._id,
      disciption : req.body.disciption,
      price:req.body.price,
      discount:req.body.discount
    }
    let createdProduct = await productModel.create(data);
    createdUser.products.push(createdProduct._id);
    await createdUser.save();
  }
  else{
    res.send("your not vendorr...!!");
  }
  res.redirect("back");

})

router.get("/edit/product/:id",isLoggedIn,async function(req,res){
  let product = await productModel.findOne({_id:req.params.id});
  res.render("edit",{product:product});
})




router.post("/update/product/:id",isLoggedIn,async function(req,res){
  let product = await productModel.findOne({_id:req.params.id});
  let user = await userModel.findOne({username:req.session.passport.user});

  if(product.sellerid.username==user.username){
    await productModel.findOneAndUpdate({_id:req.params.id},{productname:req.body.productname,price:req.body.price,disciption:req.body.disciption})
  }
  res.redirect("/profile");
})

router.get("/delete/product/:id",isLoggedIn,async function(req,res){
  let product = await productModel.findOne({_id:req.params.id}).populate("sellerid");

  let user = await userModel.findOne({username:req.session.passport.user});


  if(product.sellerid.username==user.username){
    await productModel.findOneAndDelete({_id:req.params.id});
    await user.products.splice(user.products.indexOf(product._id),1);
    await user.save();
    res.redirect("/profile");
  }
})


router.get("/wishlist/product/:id",isLoggedIn,async function(req,res){
  let product = await productModel.findOne({_id:req.params.id});
  let user = await userModel.findOne({username:req.session.passport.user});

  if(user.wishlist.indexOf(req.params.id)===-1){

    user.wishlist.push(req.params.id);
    await user.save();
  }

  res.redirect("/Allproducts");
})

router.get("/wishlist",isLoggedIn,async function(req,res){
  let user = await userModel.findOne({username:req.session.passport.user}).populate("wishlist");
  res.render("wishlist",{user})

})
router.get("/remove/:id",isLoggedIn,async function(req,res){
  let user = await userModel.findOne({username:req.session.passport.user});
  var index = user.wishlist.indexOf(req.params.id);
  await user.wishlist.splice(index,1)
  await user.save();

  res.redirect("/wishlist");

})


router.get("/Allproducts",isLoggedIn,async function(req,res){
  let loggedInuser = await userModel.find({username:req.session.passport.user}).populate("products");
  let allprods = await productModel.find();
  res.render("allprods",{allprods,loggedInuser})
})

router.get("/product/buy/:idd",isLoggedIn,async function(req,res){
  let product = await productModel.findOne({_id:req.params.idd});
  res.render("buy",{product:product});
})

router.post("/find",async function(req,res){
  let findall = await userModel.find()
  res.send(findall);

})
router.get("/sabproducts",async function(req,res){
  let findall = await productModel.find()
  res.send(findall);

})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/failed")
  }
}

function isRedirected(req,res,next){
  if(req.isAuthenticated()){
    res.redirect("/profile")
  }
  else{
    return next();
  }
}
module.exports = router;