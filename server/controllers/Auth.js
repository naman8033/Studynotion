const OTP = require('../models/OTP');
const User = require('../models/User')
const otpGenerator = require('otp-generator')
const bcrypt = require('bcrypt')
const Profile = require('../models/Profile')
const jwt = require('jsonwebtoken')
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require('dotenv').config()

//SEND OTP while signing up

exports.sendOTP = async (req,res)=> {


    try{
        
    //fetch email id of user
    const {email}=req.body;
    console.log("Email in senOtp controller",email)

    //check if already exists
    const checkuser=await User.findOne({email});

    if(checkuser){
        return res.status(401).json({
            success:false,
            message:"user already registered,Go to Login page"
        })
    }

    //otp generation
    var otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    });
    console.log("OTP generated ",otp);

    //check unique otp or not
    let result = await OTP.findOne({otp:otp});

    while(result){
        otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        const result = await OTP.findOne({otp:otp});


    }

    const createdOtp = await OTP.create({
        email,
        otp
    })

    //return response
    res.status(200).json({
        success:true,
        message:"otp message sent successfully",
        createdOtp,
    })
        
    


    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })



    }
}


//SIGN UP

exports.signUp = async (req, res) => {
    try {
        // Fetch details from request body
        const {
            email,
            firstName,
            lastName,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User is already registered",
            });
        }

        // Fetch the most recent OTP for the user by email
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

        // Validate OTP
        if (recentOtp.length === 0 || !recentOtp[0]) {
            return res.status(400).json({
                success: false,
                message: "OTP not found in database",
            });
        } else if (otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine if the user should be approved
        let approved = accountType === "Instructor" ? false : true;

        // Create profile details
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: contactNumber,
        });

        // Create a new user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        // Return success response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            newUser,
        });
    } catch (error) {
        console.log("Error found in creation:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

//LOGIN


exports.login=async (req,res)=>{
    try{
        //fetch deatils from req body
        const {email,password}=req.body;
        //validate data
        console.log(email,password);
        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:"all fields are required",
            })
        }
        //check user exists or not
        const user = await User.findOne({email}).populate("additionalDetails").exec();
        if(!user){
            return res.status(401).json({
                success:false,
                message:"user does not exists please sign up",
            })
        }
        console.log(user)
        //generate JWT , after matching password
        if(await bcrypt.compare(password,user.password)){ //password->entered by user
                 const payload={
                    email:user.email,
                    id:user._id,
                    accountType:user.accountType,
                 }
            const token =jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn:"2h",
            });
            console.log(token);

            user.toObject();
            user.token=token;  // token is inserted in user during login to verify by auth middleware
            user.password=undefined;


        //create cookie and send response
        const options ={
            expiresIn:new Date(Date.now()+ 3*24*60*60*1000),
            httpOnly:true,
        }
        console.log(options);
        res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            user,
            message:"logged in successfully",
        })
    }
        else{
            return  res.status(401).json({
                success:false,
                message:"password is incorrect",
            })

        }

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"login failure , please try again"
        })

    }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		// if (newPassword !== confirmNewPassword) {
		// 	// If new password and confirm new password do not match, return a 400 (Bad Request) error
		// 	return res.status(400).json({
		// 		success: false,
		// 		message: "The password and confirm password does not match",
		// 	});
		// }

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true },
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};
 