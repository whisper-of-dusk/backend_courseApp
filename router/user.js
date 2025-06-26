const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken")
const{JWT_USER_PASSWORD}=require("../config");
const{Router, response}=require("express")//import router
const{userModel, purchaseModel, courseModel}=require("../db");
const userRouter= Router();
const{z}=require("zod");
const { string } = require("zod/v4");
const { userMiddleware } = require("../middleware/user");


userRouter.post("/signup",async function(req,res){

    const requiredBody=z.object({
        email: z.string().min(5).email(),
        password:z.string().min(6).max(12),
        firstName:z.string().min(3).max(10),
        lastName:z.string().min(3).max(10)
    });
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        res.json({
            messege:"incorrect format",
            error:parsedDataWithSuccess.error
        })
    return
    }

    const{ email, password, firstName, lastName}=req.body;

    let errorThrown = false;
    
    try{
        const response = await userModel.findOne({
        email:email
    });

    if (response){
        res.status(403).json({
            message:"email already exist"
        })
        return
    }


        const hashPassword = await bcrypt.hash(password,5);

         await userModel.create({
             email:email,
             password:hashPassword,
             firstName:firstName,
            lastName:lastName
            });
    }catch(e){
        res.json({
            message:"something went wrong"
        })
        errorThrown="true"
    }
    
    if(!errorThrown){
        res.json({
        message:"you are signed up"
        })
    }
})
userRouter.post("/signin",async function(req,res){
    
    const{email, password}=req.body;

     const requiredBody=z.object({
        email: z.string().min(5).email(),
        password:z.string().min(6).max(12),
        
    });
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        res.json({
            messege:"incorrect format",
            error:parsedDataWithSuccess.error
        })
    return
    }

    const response = await userModel.findOne({
        email:email
    });

    if (!response){
        res.status(403).json({
            message:"incorect email"
        })
        return
    }

    const passwordMatch = await bcrypt.compare(password,response.password);

    if(passwordMatch){
        const token = jwt.sign({
            id: response._id.toString()
        },JWT_USER_PASSWORD);

        res.json({
            token
        })
    }else{
         res.status(403).json({
            message:"incorect password"
        })
    }

})
userRouter.get("/purchases",userMiddleware,async function(req,res){

    const userId=req.userId;

    const purchases = await purchaseModel.find({
        userId,
    })

    const courseData= await courseModel.find({
        _id:{$in: purchases.map(x => x.courseId)}
    })
    res.json({
        purchases,
        courseData
    })
    
})


module.exports = {
    userRouter: userRouter
}