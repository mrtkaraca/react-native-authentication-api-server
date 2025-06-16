import { connection } from "./connection.js";

export const createEmailVerificationToken = async(token,tokenExp)=>{
  try{
    const [result] = await connection.promise().query('Insert into emailverificationsession values (?,?,?)',[token,tokenExp,false]);
    if(result.affectedRows >= 1){
      return result;
    }
  }
  catch(err){
    console.log(err);
    return undefined;
  }
}

export const emailVerificationTokenSetStatus = async(boolean,token)=>{
  try{
    const [result] = await connection.promise().query('update emailverificationsession set `isActive` = ? where token = ?',[boolean,token]);
   
    if(result.affectedRows >= 1){
      return result.changedRows ? true : false;
    }
    else{
      return null;
    }
  }
  catch(err){
    console.log(err);
    return undefined
  }
  
}
  
export const getToken = async(token)=>{
  try{
    const [result] = await connection.promise().query('select * from emailverificationsession where token = ?',[token]);
    if(result.length == 1){
      return result
    }
    else{
      return null;
    }
  }
  catch(err){
    return undefined
  }
}
  