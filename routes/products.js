var mongoose = require("mongoose");
mongoose.set('strictQuery', true);

var plm = require("passport-local-mongoose");
const { schema } = require("./users");



var productSchema = mongoose.Schema({
  productname:String,
  pic:{
    type:Array,
    default:[]
  },
  sellerid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  disciption : String,
  price:Number,
  discount:Number
  
})

productSchema.plugin(plm);
module.exports = mongoose.model('product',productSchema);
