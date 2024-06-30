
const User= require("../models/User")
const mailSender=require("../utils/mailSender")
const bcrypt=require("bcrypt")
const crypto = require("crypto")

//ek reset password link bhejega mail pr jispr jakr password reset kr skte h



//reset password token
exports.resetPasswordToken = async (req,res)=>{
  try{
      //get email from req body
      const email = req.body.email;
      //check user for this email exists or not
      const user=await User.findOne({email:email});
      if(!user){
          return res.status(401).json({
              success:false,
              message:"user not exists"
          })
      }
      //generate token
      let token = crypto.randomUUID();
      //update user by adding token and expiration time
      const updateDetails= await User.findOneAndUpdate(
          {email:email},
          {
              token:token,
              resetPasswordExpires: Date.now() + 5*60*1000,
          },
          {new:true}
      );
      //create url
       const url = `http://localhost:3000/update-password/${token}`
      //send mail containing the url
      await mailSender(email,
                       "Password Link",
                       `Password Reset link : ${url}`);
      //return response
      return res.json({
          success:true,
          message:"reset link sent successfully ,please check mail",
      })
  
  }
  
  catch(error){
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"error in reseting password , try again",
    })
  }
   
}




//reset password

exports.resetPassword = async (req,res)=>{
      
    try{

            //data fetch
     const {password,confirmPassword,token}=req.body;  // token req ki body m frontend n dala
     //validation
     if(password!=confirmPassword){
       return res.json({
           success:false,
           message:"password do not match with confirm password",
       });
     }
     //get user deatils from db
     const userDetails=User.findOne({token:token});
     //if  no entry of token - invalid token
     if(!userDetails){
       return res.json({
           success:false,
           message:"token not found in db or token is invalid",
       });
     }
     //check token time
     if(userDetails.resetPasswordExpires < Date.now()){
       return res.json({
           success:false,
           message:"your token is expired please regenrate it",
       });
     }
     //hash pwd
     const hashedPassword=await bcrypt.hash(password,10);

     //password update in db
     await User.findOneAndUpdate(
        {token:token}, //basis of search
        {password:hashedPassword}, // thing that need to be change
        {new:true},
    );
    //return response
    return res.json({
        success:true,
        message:"password resetted successfully",
    });

     

    }
    catch(error){

        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }


}