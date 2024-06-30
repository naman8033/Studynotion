const Section=require("../models/Section")
const Course=require("../models/Course")

exports.createSection = async (req,res) => {
 
     try{

        //data fetch
        const {sectionName,courseId}=req.body;
        //validation
        if(!sectionName || !courseId){
            return res.status(401).json({
                success:false,
                message:"missing properties "
            })

        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section ObjectId
        const updatedCourseDetails= await Course.findByIdAndUpdate(
                                                    courseId,
                                                    {
                                                        $push:{
                                                            courseContent:newSection._id,
                                                        }
                                                    },
                                                    {new:true},
        )
        
        //return response
        return res.status(200).json({
            success:true,
            message:'section created  succesfullky',
            updatedCourseDetails,
        })

        }
     catch(error){
            console.log(error)
             return res.status(500).json({
                success:False,
                message:"unable to create swection"
             })
     }

}


//UPDATE SECTION

exports.updateSection = async (req,res) => {

    try{
        //fetch input
        const {sectionName,sectionId}=req.body;
        //validation
        if(!sectionName || !sectionId){
            return res.status(401).json({
                success:false,
                message:"missing properties "
            })
        }
        //update section
        const section = await Section.findByIdAndUpdate({sectionId},{sectionName},{new:true});
         
        return res.status(200).json({
            success:true,
            message:"section updated successfully",
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:False,
            message:"unable to create swection"
         })
    }

    }
exports.deleteSection = async (req,res)=>{
    try{
        //get Id -> assuming that we are sending ID in params
        const {sectionId}=req.params;
        //delete section
        await Section.findByIdAndDelete(sectionId);
        //TODO: do we need to delete the section id from course schema

        return res.status(200).json({
            success:true,
            message:"section deleted successfully",
        });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:False,
            message:"unable to delete swection"
         })

    }
}

