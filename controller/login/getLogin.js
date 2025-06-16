import "dotenv/config"
import { checkUser } from "../../model/mysql/users.js";
import jwt  from "jsonwebtoken";
import * as bcrypt from "bcrypt"

const createAuthTokenJWT = (userId)=>{
    var token = jwt.sign({
        sub: userId,
        iss: "tarotcuapp",
        nbf: Math.floor(Date.now() / 1000),
        iat : Math.floor(Date.now() / 1000)
    },process.env.JWT_SECRET_KEY);
    return token;
}


export const getLogin = {
    getSignIn : function(req,res){
        if(req.method === "POST"){
            const bodyParse = [];
            req.on("data",(data)=>{
                bodyParse.push(data);
            })

            req.on("end",async ()=>{
                const bodyParseBuffer = Buffer.concat(bodyParse);
                const stringData = bodyParseBuffer.toString();
                var item;

                if(stringData){
                    item = JSON.parse(stringData);
                }

                const response = {
                    isUser:null,
                    isCorrectPassword:null,
                    userNickName:null,
                    authToken:null
                }

                if(item?.user && item?.userPassword){
                    const userInfo = await checkUser(item.user);
                    if(userInfo){
                        response.isUser = true;
                        const compareHash = await bcrypt.compare(item.userPassword,userInfo[0].userPassword)
                        if(compareHash){
                            const authToken = await createAuthTokenJWT(userInfo[0].userId);
                            response.isCorrectPassword = true;
                            response.userNickName = userInfo[0].userNickName
                            response.authToken = authToken;
                        }
                        else{
                            response.isCorrectPassword = false;
                        }
                        res.statusCode = 200;
                    }
                    else{
                        userInfo === false ? (res.statusCode = 200,response.isUser=false) : (res.statusCode = 503)
                    }
                }
                else{
                    res.statusCode = 400;
                }
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify(response));
            })
        }
    },
    signInWithAuthToken : async function(req,res){
        if(req.method === "POST"){
            const response = {
                isValidAuthToken:null
            }

            if(req.jwtTokenSub){
                const verifyToken = await checkUser(req.jwtTokenSub);
                if(verifyToken){
                    response.isValidAuthToken = true;
                    res.statusCode = 200;
                }
                else{
                    verifyToken === false ? (response.isValidAuthToken = false, res.statusCode = 200) : (res.statusCode = 503)
                }
            }
            else{
                res.statusCode = 400;
            }
            
            res.setHeader("Content-Type","application/json");
            res.end(JSON.stringify(response));
        }
    }
}