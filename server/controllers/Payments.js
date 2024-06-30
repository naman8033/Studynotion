const {instance} = require('../config/razorpay');
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose, Mongoose } = require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress")

//capture the paymentand initiate the razorpay order

exports.capturePayment = async (req,res)=>{
    //get courseId and UserId
    const {course_id}=req.body;
    const {userId}= req.user.id;
    //validate them
    //valid courseId
    
    if(!course_id){
        res.json({
            success:false,
            message:"please provide valid course id",
        })
    }
    //valid courseDetail
    let course;
    try{
        course = await Course.findById(courseId);
        if(!course){
            return res.json({
                success:false,
                message:"could not find the course",
            })
        }
            //user already pay for the same course ???
            const uid = new mongoose.Types.ObjectId(userId); //convert string user id into object id
             if(course.studentEnrolled.includes(uid)){
                return res.json({
                    success:false,
                    message:"user already enrolled in the same course",
                });
             }
 

    }
    catch(error){
        console.error(error);
        return res.json({
            success:false,
            message:error.message,
        })

    }
             //create order
             const amount = course.price;
             const currency="INR";

             const options ={
                amount:amount,
                currency,
                receipt:Math.random(Date.now()).toString(),
                notes:{//they will be used in future to provide course to the student  after authorization
                    courseId: course_id,
                    user_id,
                }
             };

             try{
                //initiate the payment using razorpay
                const paymentResponse = await instance.orders.create(options);
                console.log(paymentResponse);
                 //return response
                return  res.status(200).json({
                    success:true,
                    courseName:course.courseName,
                    courseDescription:course.courseDescription,
                    thumbnail:course.thumbnail,
                    orderId:paymentResponse.id,
                    currency:paymentResponse.currency,
                    amount:paymentResponse.amount,
                })

             }
             catch(error){
                console.log(error);
                res.json({
                    success:false,
                    message:"could not iniatiate order"
                })
            }

}




exports.verifyPayment = async (req,res) => {
    console.log("request in verifyPayment is", req)
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"Payment Failed"});
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
                                    .update(body.toString())
                                    .digest("hex")

    if (expectedSignature === razorpay_signature) {
        
        await enrollStudents(courses, userId, res);

        return res.status(200).json({success:true, message:"Payment Verified"});
    }
    return res.status(200).json({success:"false", message:"Payment Failed"});
}

const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
    }

    for(const courseId of courses) {
        try {
            const updatedCourse = await Course.findByIdAndUpdate(courseId,
                {
                    $push: {
                        studentsEnrolled: userId
                    }
                }, {new:true})  

            if (!updatedCourse) {
                return res.status(500).json({success:false,message:"Course not Found"});
            }

            const courseProgress = await CourseProgress.create({
                courseID:courseId,
                userId:userId,
                completedVideos: [],
            })

            const updatedStudent = await User.findByIdAndUpdate(userId, {
                $push: {
                    courses: courseId,
                    courseProgress: courseProgress._id,
                }
            }, {new: true})

            const emailResponse = await mailSender(
                updatedStudent.email,
                `Successfully Enrolled into ${updatedCourse.courseName}`,
                courseEnrollmentEmail(updatedCourse.courseName, `${updatedStudent.firstName}`)
            )
        } catch (error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
}

exports.sendPaymentSuccessEmail = async (req,res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try {
        const user = await User.findById(userId);
        await mailSender(
            user.email,
            `Payment Received`,
            paymentSuccessEmail(`${user.firstName}`,
             amount/100,orderId, paymentId)
        )
    } catch (error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}












//VERIFY SIGNATURE PF RAZORPAY AND SERVER

//  exports.verifySignature = async (req,res)=>{
//     const webhookSecret = "12345678";

//     const signature= req.headers["x-razorpay-signature"];

//     const shasum = crypto.createHmac("sha256",webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest){
//         console.log("Payemnt is Authorised");

//          const {courseId,userId}=req.body.payload.payment.entity.notes;

//                         try{
//                             //fulfill the action

//                             //find the course and enroll the student in it
//                             const enrolledCourse =await Course.findOneAndUpdate(
//                                                                {_id:courseId},
//                                                                {$push:{studentEnrolled: userId},
//                                                             {new:true}},
//                             );

//                             if(!enrolledCourse){
//                                 return res.json({
//                                     success:false,
//                                     message:"course not found",
//                                 });
//                             }
//                             console.log(enrolledCourse);

//                            //find the student and add course into thier enrolled courses
//                            const enrolledStudent = await User.findOneAndUpdate(
//                                                                               {_id:userId},
//                                                                               {$push:{courses:courseId}},
//                                                                               {new:true},              
//                            )
//                            console.log(enrolledStudent);

//                            //confirmation mail send krna h
//                            const  emailResponse = await mailSender (
//                                                       enrolledStudent.email,
//                                                       "COngratulations from Codehelp",
//                                                       "COngratulations , you are onboarded into codehelp course",
//                            );
//                            console.log(emailResponse);
//                            return res.json({
//                             success:true,
//                             message:"signature verified and course added",
//                            })




//                         }
//                         catch(error){
//                             console.log(error);
//                             return res.status(500),json({
//                                 success:false,
//                                 message:error.message,
//                             })

//                         }

//     }
//     else{
//         return res.status(400).json({
//             success:false,
//             message:"signature not verified",
        
//         });

//     }


// }


 