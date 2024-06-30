const RatingAndReviews=require("../models/RatingAndReviews")
const Course=require("../models/Course")


//create rating

exports.createRating =async (req,res)=>{

    try{

        //get user id
        const userId=req.user.id;
        //fetch data from req body
        const {rating,review,courseId}=req.body;
        //check if user is enrolled in course or not
        const courseDetails = await Course.findOne(
            {_id:courseId,
                studentEnrolled:{$elemMatch:{$eq: userId}},
            });
        if(!courseDetails){
            return res.json({
                success:false,
                message:"student is not enrolled in the course",
            })
        }  
        
        //user already reviewed or not
         const alreadyReviewed = await RatingAndReviews.findOne({
            user:userId,
            course:courseId,
        });
        if(alreadyReviewed){
            return res.json({
                success:false,
                message:"user is already reviewed the course",
            });
        }
        //create rating and review
        const ratingReview = await RatingAndReviews.create({
                                          rating,review,
                                          course:courseId,
                                          user:userID,
                                                });
         //UPDATE COURSE WITH THIS rating/review
       const updatedCourseDetails=  await Course.findOneAndUpdate({courseId},
                                              {
                                                $push:{
                                                    ratingAndReviews:ratingReview._id,
                                                }
                                              },
                                            {new:true});
          console.log(updatedCourseDetails);
          
          //return response
           return res.status(200).json({
            success:true,
        message:"rating review created successfully",           })                                 





    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }

}


//get average rating

exports.getAverageRating = async (req,res)=>{

    try{
          //get course ID
          const courseId = req.body.courseId;
          //calculate avg rating

          const result = await RatingAndReviews.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating: {$avg : "rating"},
                }
            }
          ]);

          //return rating
          if(result.length > 0){

            return res.status(200).json({
                success:true,
                averageRating:result[0].averaageRating,
            })
          }

          //if no rating/review exist
          return res.status(200).json({
            success:true,
            message:"avg rating is 0,no ratings given till now",
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

//get all rating and reviews

exports.getAllRatingReview = async (req, res) => {
    try {
      const allReviews = await RatingAndReview.find({})
        .sort({ rating: "desc" })
        .populate({
          path: "user",
          select: "firstName lastName email image", // Specify the fields you want to populate from the "Profile" model
        })
        .populate({
          path: "course",
          select: "courseName", //Specify the fields you want to populate from the "Course" model
        })
        .exec()
  
      res.status(200).json({
        success: true,
        data: allReviews,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve the rating and review for the course",
        error: error.message,
      })
    }
  }