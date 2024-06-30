const mongoose= require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
 
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires: 100*6000000,
    },

});

//schema k baad model k phle
// a function to send emails

async function sendVerificationEmail(email,otp){
    try{
        const mailresponse = await mailSender(email,"Verification email from studynotion",otp);
            console.log("email sent successfully",mailresponse);
        }

    
    catch(err){
        console.log("error occured while sending mail",err);
        throw err;

    }
}

//pre middleware doc save hone s phle mail bhejkr otp verify krenge
OTPSchema.pre("save",async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})


module.exports=mongoose.model("OTP",OTPSchema);