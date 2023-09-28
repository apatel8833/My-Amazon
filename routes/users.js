var mongoose = require("mongoose");
mongoose.set('strictQuery', true);

var plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/memezon").then(function(){
  console.log("connecteddd...!!,http://localhost:5000");
})

var userSchema = mongoose.Schema({
  name:String,
  username:String,
  password:String,
  email:String,
  contactNo : String,
  gsti:{
    type:String,
    default:''
  },
  address:{
    type:String,
    default:''
  },
  isseller:{
    type:Boolean,
    default:false
  },
  pic:String,
  products:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
  }],
  wishlist:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
  }],
  otp:{
    type:String,
    default:" "
  }
  
})

userSchema.plugin(plm);
module.exports = mongoose.model('user',userSchema);
