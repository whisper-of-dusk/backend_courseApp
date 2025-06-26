const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken")
const {Router}=require('express')
const adminRouter =Router();
const {adminModel, courseModel}=require("../db")
const{z}=require("zod");
const { string } = require("zod/v4");
const{JWT_ADMIN_PASSWORD}=require("../config");
const { adminMiddleware } = require("../middleware/admin");

// adminRouter.use(adminMiddleware);

adminRouter.post("/signup",async function(req,res){
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
         const response = await adminModel.findOne({
        email:email
    });

    if (response){
        res.json({
            message:"email already exist"
        })
        return
    }

        const hashPassword = await bcrypt.hash(password,5);

         await adminModel.create({
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
adminRouter.post("/signin",async function(req,res){
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

    const response = await adminModel.findOne({
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
        },JWT_ADMIN_PASSWORD);

        res.json({
            token
        })
    }else{
         res.status(403).json({
            message:"incorect password"
        })
    }
})

adminRouter.post("/course",adminMiddleware,async function(req,res){
    const adminId=req.userId;

    const{title, discription, imageurl, price, }=req.body;

    const course = await courseModel.create({
        title:title,
        discription:discription,
        imageUrl:imageurl,
        price:price,
        creatorId:adminId
    })

    res.json({
        message:"course created",
        courseId: course._id
    })
})

adminRouter.put("/course",adminMiddleware,async function (req,res) {
    const adminId=req.userId;

    const{title, discription, imageurl, price,courseId }=req.body;


    const course = await courseModel.updateOne({
        _id: courseId,
        creatorId:adminId
    },{
        title:title,
        discription:discription,
        imageUrl:imageurl,
        price:price
    })

    res.json({
        message:"course updated",
        courseId: course._id
    })
    
})

adminRouter.get("/course/all",adminMiddleware,async function (req,res) {
    const adminId=req.userId;

    const courses = await courseModel.find({
        creatorId:adminId
    });

    res.json({
        courses
    })
    
})


module.exports={
    adminRouter: adminRouter
}