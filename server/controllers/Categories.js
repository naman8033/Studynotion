const Category = require('../models/Category');
const Course = require('../models/Course')
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

exports.createCategory=async (req,res)=>{
       
    try{
         
        //fetch details from req body
        const {name,description}=req.body;
        //validation
        if(!name || !description){
            return resstatus(401).json({
                success:false,
                message:"All fields are required",
            })
        }
        //create entry in db
        const categoryDetails=await Category.create({
            name:name,
            description:description,
        });
        console.log(categoryDetails);

        if (!categoryDetails) {
          return res.status(401).json({
              success:false,
              message:"Error in pushing new tag to db"
          }) 
      }


        //return response
        return res.status(400).json({
            success:true,
            message:"Category created successfully"
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })

    }
    

}



//GET ALL Category
exports.showAllCategories=async (req,res)=>{

   try{
       const allCategoriess=await Category.find({},{name:true,description:true});
        
       return res.json({
        success:true,
        message:"all Category returned successfully",
        allCategoriess
       }); 
   }
   catch(error){
    return res.status(500).json({
        success:false,
        message:error.message,
    });

   }


}


//CATEGORY PAGE DETAILS
exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      console.log("PRINTING CATEGORY ID: ", categoryId);
  
      // Get courses for the specified category
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
  
      console.log("SELECTED COURSE", selectedCategory)

      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }

      // Handle the case when there are no courses
      if (selectedCategory.courses.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }
  
      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
         _id: { $ne: categoryId },
        course: { $not: { $size: 0 } }
      })
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec()

      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
      console.log()


      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
  
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

