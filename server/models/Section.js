const mongoose= require("mongoose");

const sectionSchema = new mongoose.Schema({
 
    title:{
        type:String,
    },
    subSection:[
        {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"SubSection",
        }
    ],

});

module.exports=mongoose.model("Section",sectionSchema);