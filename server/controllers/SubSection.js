const Section=require("../models/Section")
const SubSection=require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async (req,res)=> {
    try{ 
        //fetch data from req body
        const {sectionId,title,description,timeDuration}=req.body
        //extract file/video
        const video=req.files.videoFile;
        //validation
        if(!sectionId||!title|| !description || !timeDuration || !video){
            return res.status(400).json({
                success:false,
                message:"fields are missing ",
            });
    
        }

        //upload image 
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);  //secure url
        //create subsection
        const subSectionDetails=await SubSection.create({
            title:title,
            description:description,
            timeDuration:timeDuration,
            videoUrl:uploadDetails.secure_url,
        })
        //update section with this sub section ObjectId
        const updatedSection = await Section.findById(sectionId).populate("subSection")

                                                   
        return res.status(400).json({
            success:true,
            message:"sub section created successfully",
            updatedSection,

        })



    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:true,
            message:"sub section creation Failed",
            updatedSection,

        })


    }


    

}


//SUB SECTION UPDATE

exports.updateSubSection = async (req,res)=>{

    try{
        //fetch data 
        const {SubSectionId,title,description,timeDuration,videoUrl}=req.body;
        //update subsection
        const updatedSubSection = await SubSection.findOneAndUpdate(
                            {SubSectionId},
                            {title:title,
                                description:description,
                                timeDuration:timeDuration,
                                videoUrl:videoUrl,
                            },
                            {new:true}
        );
     

         
    }
    catch(error){
        return res.status(500).json({
            success:true,
            message:"sub section updationFailed",
            

        })


    }
}

//delete sub section
exports.deleteSubSection = async (req,res) =>{
    try {
        
        const {subSectionId,sectionId } = req.body;
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
              $pull: {
                subSection: subSectionId,
              },
            }
          )

        if(!subSectionId) {
            return res.status(400).json({
                success:false,
                message:'SubSection Id to be deleted is required',
            });
        }

        
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }

      const updatedSection = await Section.findById(sectionId).populate("subSection")
  
      return res.json({
        success: true,
        data:updatedSection,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to delete SubSection',
            error: error.message,
        })
    }
}