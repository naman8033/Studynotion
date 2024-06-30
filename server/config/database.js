const mongoose=require("mongoose")
require('dotenv')


exports.connect=()=>{
   mongoose.connect(process.env.MONGODB_URL)
    .then(()=>console.log("DB successfully connected"))
   .catch((error)  => {
    console.log("DB facing coonection issues")
    console.log(error)
    process.exit(1);
   } )
};
            