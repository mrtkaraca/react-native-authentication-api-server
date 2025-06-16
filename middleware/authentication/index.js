import jwt  from "jsonwebtoken";

export const isValidAuthApiKey = (req,res)=>{
    const authorization = req.headers.authorization;
    if(authorization == process.env.AUTHORIZATION_API_KEY){
        return true;
    }
    else{
        res.statusCode = 401;
        res.end("Unauthorized Request");
        return false;
    }
}

export const isValidJWTAuthToken = (req,res)=>{
    const authorization = req.headers.authorization;
    
    if(authorization){
        try{
            const isValidToken = jwt.verify(authorization,process.env.JWT_SECRET_KEY);
            req.jwtTokenSub = isValidToken.sub
            return true
        }
        catch(err){
            res.statusCode = 401;
            res.end("Unauthorized Request");
            return false
        }
    }
    else{
        res.statusCode = 401;
        res.end("Unauthorized Request");
        return false
    }
}