import "dotenv/config"
import jwt  from "jsonwebtoken";
import * as url from "url"
import * as ejs from "ejs"
import * as fs from "fs"
import * as bcrypt from "bcrypt"

import { checkUser,createUser } from "../../model/mysql/users.js";

import { createEmailVerificationToken,emailVerificationTokenSetStatus,getToken } from "../../model/mysql/emailverificationsession.js";
import { sendMailNodeMailer } from "../../services/nodeMailer/index.js";


const createEmailVerificationTokenJWT = (userMail)=>{
    var token = jwt.sign({
        sub: userMail,
        iss: "authentication",
        exp: Math.floor(Date.now() / 1000) + (60*60),
        nbf: Math.floor(Date.now() / 1000),
        iat : Math.floor(Date.now() / 1000)
    },process.env.JWT_SECRET_KEY);
    return token;
}

const createAuthTokenJWT = (userId)=>{
    var token = jwt.sign({
        sub: userId,
        iss: "authentication",
        nbf: Math.floor(Date.now() / 1000),
        iat : Math.floor(Date.now() / 1000)
    },process.env.JWT_SECRET_KEY);
    return token;
}

const getTokenExp = (token)=>{
    return jwt.verify(token,process.env.JWT_SECRET_KEY).exp;
}


export const getRegister = {
    getCheckUser : (req,res)=>{
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
                }

                if(item?.user){
                    const user = await checkUser(item.user);
                    
                    if(user){
                        response.isUser = true;
                    }
                    else{
                        user === false ? (response.isUser = false, res.statusCode = 200): (res.statusCode = 503)
                    }
                }
                else{
                    res.statusCode = 400;
                }
   
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify(response));
            })
        }
        else{
            res.end();
        }
    },
    getSendVerificationMail : (req,res) =>{
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
                };
                const response = {
                    isMailSent:null,
                    userToken:null
                }

                if(item?.userEmail){
                    const token = await createEmailVerificationTokenJWT(item.userEmail);
                    const tokenExp = await getTokenExp(token);
                    const verificationLink = `${process.env.SERVER}://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/register/validateEmail?token=${token}`;
                    const tokenSession = await createEmailVerificationToken(token,tokenExp);
                    if(tokenSession){
                        const result = await sendMailNodeMailer(item.userEmail,verificationLink);

                        if(result?.messageId){
                            response.userToken = token;
                            response.isMailSent = true;
                        }
                        else{
                            response.isMailSent = false;
                        }
                        res.statusCode = 200;
                    }
                    else{
                        res.statusCode = 503;
                    }
                }
                else{
                    res.statusCode = 400;
                }

                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(response));
            })
        }
        else{
            res.end();
        }
    },
    getCheckVerificationTokenActivity : (req,res)=>{
        if(req.method === "POST"){
            const bodyParse = [];
            req.on("data",(data)=>{
              bodyParse.push(data);
            })
        
            req.on("end",async()=>{
                const bodyParseBuffer = Buffer.concat(bodyParse);
                const stringData = bodyParseBuffer.toString();
                var item;
                if(stringData){
                    item = JSON.parse(stringData);
                }

                const response = {
                    isActive : null 
                }

                if(item?.userToken){
                    const token = await getToken(item.userToken);
                    if(token){
                        response.isActive = token[0].isActive;
                        res.statusCode = 200;
                    }
                    else{
                        token === null ? (res.statusCode = 200) : (res.statusCode = 503);
                    }
                }
                else{
                    res.statusCode = 400;
                }

                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(response));
   
            })
        }
        else{
            res.end();
        }    
    },
    getValidateEmail : async(req,res)=>{
        if(req.method === "GET"){
            const queryObject = url.parse(req.url, true).query;
            var token = queryObject.token;
        
            let bodyParams = {
                successful:null,
                message:null
            }
    
            if(token){
                try{
                    const tokenVerify = jwt.verify(token,process.env.JWT_SECRET_KEY);
                    const updateActivity = await emailVerificationTokenSetStatus(true,token);
    
                    if(updateActivity){
                        res.statusCode = 200;
                        bodyParams.successful = true;
                        bodyParams.message = "Verification successful.";
                    }
                    else{
                        updateActivity === false ? 
                        (
                            bodyParams.successful = false,bodyParams.message = "The link is already verified!",res.statusCode = 200
                        ) : 
                        (
                            updateActivity === null ? 
                            (
                                bodyParams.successful = false,bodyParams.message = "The connection is expired!",res.statusCode = 200
                            ) : 
                            (
                                bodyParams.successful = false,bodyParams.message = "Something went wrong. Try again later.",res.statusCode = 503
                            )
        
                        )
                    }

                }
                catch(err){
                    console.log(err);
                    if(err instanceof jwt.JsonWebTokenError){ 
                        res.statusCode = 400;
                        bodyParams.successful = false;
                        bodyParams.message = "The link is invalid!";
                    }
                }
    
            }
            else{
                res.statusCode=400;
                bodyParams.successful = false;
                bodyParams.message = "The link is invalid!";
            }
    
            var body = await fs.readFileSync(process.cwd() + '/view/register/verifyEmail.ejs','utf-8');
            let template = await ejs.render(body,{successful:bodyParams.successful,message:bodyParams.message});
            res.setHeader("Content-Type", "text/html")
            res.end(template);
        }
        else{
            res.end();
        }

    },
    getCreateUser: async(req,res)=>{
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
                    isCreated:null,
                    authToken:null,
                    userNickName:null
                }

                const saltRound = 12;

                if(item.userNickName && item.userPassword && item.userEmail){
                    const hashPassword =await bcrypt.hash(item.userPassword, saltRound);
                    if(hashPassword){
                        item["userPassword"] = hashPassword;
                        const userUUID = await createUser(item);
                        if(userUUID.length){
                            const authToken = await createAuthTokenJWT(userUUID[0].userId);
                            response.isCreated = true;
                            response.authToken = authToken;
                            response.userNickName = item.userNickName
                            res.statusCode = 200;
                        }
                        else{
                            res.statusCode = 503;
                        }
                    }
                    else{
                        res.statusCode = 503;
                    }
                }
                else{
                    res.statusCode = 400;
                }
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(response));
            })
        }
    }
}