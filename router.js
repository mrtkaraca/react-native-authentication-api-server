import * as url from "url"
import * as fs from "fs"
import { getRegister } from "./controller/register/getRegister.js"
import { getLogin } from "./controller/login/getLogin.js"
import { errorPage } from "./controller/404-page.js"

import { isValidAuthApiKey,isValidJWTAuthToken } from "./middleware/authentication/index.js"

const mimes = [
    {
        path:'css',
        contentType:'text/css'
    },
    {
        path:'png',
        contentType:'image/png'
    },
    {
        path:'jpg',
        contentType:'image/jpg'
    }
]

const paths = [
    {path:'/login/signIn',route:getLogin.getSignIn,middleware:[isValidAuthApiKey]},
    {path:'/login/signInWithAuthToken',route:getLogin.signInWithAuthToken,middleware:[isValidJWTAuthToken]},
    {path:'/register/checkUser',route:getRegister.getCheckUser,middleware:[isValidAuthApiKey]},
    {path:'/register/sendVerificationMail',route:getRegister.getSendVerificationMail,middleware:[isValidAuthApiKey]},
    {path:'/register/validateEmail',route:getRegister.getValidateEmail},
    {path:'/register/checkVerifyTokenActivity',route:getRegister.getCheckVerificationTokenActivity,middleware:[isValidAuthApiKey]},
    {path:'/register/createUser',route:getRegister.getCreateUser,middleware:[isValidAuthApiKey]}
]

const findMimes = (path)=>{   
    let rg;
    for(let i = 0;i< mimes.length;i++){
        rg = new RegExp(`.(${mimes[i].path})$`);

        if(rg.test(path)){
            return mimes[i];
        }
    }
    return false;
};

const findPath = (path,req,res)=>{
    for(let i = 0 ; i < paths.length;i++){
        if(paths[i].path == path){
            if(paths[i].middleware){
                for(let j = 0; j < paths[i].middleware.length; j++){
                    let check = paths[i].middleware[j](req,res);
                    if(check){
                        continue;
                    }
                    else{
                        return;
                    }
                }
                return paths[i].route(req,res);
            }
            else{
                return paths[i].route(req,res);
            }
        }
    }
    return errorPage(req,res);
};

export const getRouter = function(req, res) {

    req.requrl = url.parse(req.url, true);

    var path = decodeURI(req.requrl.pathname);
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    
    var ext = findMimes(path);
    if(ext){
        if(fs.existsSync(__dirname + path)){
            var data = fs.readFileSync(__dirname + path)
            res.statusCode = 200;
            res.setHeader("Content-Type",`${ext.contentType}`)
            res.write(data,"utf8");
            res.end();
        }
        else{
            return errorPage(req,res);
        }
    }
    else{
        findPath(path,req,res);
    }

}