 const jwt=require("jsonwebtoken");
 require("dotenv").config();
 const User=require("../models/User");

 //auth middleware

 exports.auth=async (req,res,next)=>{
    try{
        //extract the token
         const token=req.body.token 
         || req.cookies.token
         || req.token("Authorisation").replace("bearer","");

         if(!token){
            return res.status(401).json({
                success:false,
                message:"token is missing",
            });
         }

         //verify the token
         try{
            const decode= jwt.verify(token,process.env.JWT_SECRET);
             console.log(decode);
             req.user=decode;
         }
         catch(err){
            return res.status(500).json({
                success:false,
                message:"token is invalid",
            })
           }

           next(); //next middleware

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"sommething went wrong while validating token",
        });

    }
 }

 //isStudent

 exports.isStudent=async (req,res,next)=>{

    try{
        if(req.user.accountType !="Student"){
            return res.status(500).json({
                success:false,
                message:"This is a protected route for students only",
            });
    
        }
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified please try again",
        });


    }
 }

 //isInstructor
 exports.isInstructor=async (req,res,next)=>{

    try{
        if(req.user.accountType !="Instructor"){
            return res.status(500).json({
                success:false,
                message:"This is a protected route for Instructor only",
            });
    
        }
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified please try again",
        });


    }
 }

 //isAdmin
 exports.isAdmin=async (req,res,next)=>{

    try{
        if(req.user.accountType !=="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only",
            });
    
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user role cannot be verified please try again",
        });


    }
 }
 

