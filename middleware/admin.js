const{JWT_ADMIN_PASSWORD}=require("../config");
const jwt =require("jsonwebtoken");
function adminMiddleware(req,res,next){
    const token = req.headers.token;
    try {
        const decoded = jwt.verify(token,JWT_ADMIN_PASSWORD);
    if(decoded){
        req.userId= decoded.id;
        next();
    }else{
        res.status(403).json({
            message:"not signed in"
        })
    }
    } catch (e) {
        res.json({
            message:"invalid token"
        })
        
    }
    


}

module.exports = {
    adminMiddleware:adminMiddleware
}