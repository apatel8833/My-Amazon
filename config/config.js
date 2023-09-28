var path = require('path');
var crypto = require('crypto');
var multer = require('multer');


const userimages = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/userimages/')
  },
  filename: function (req, file, cb) {
      crypto.randomBytes(14,function(err,buff){
          var fn=buff.toString("hex")+path.extname(file.originalname); 
          cb(null,fn);
      })
  }
});
const productimage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, './public/images/productimages/')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(14,function(err,buff){
            var fn=buff.toString("hex")+path.extname(file.originalname);
            cb(null,fn);
        })
    }
});

module.exports={userimages,productimage};