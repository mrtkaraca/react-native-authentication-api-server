import { connection } from "./connection.js";



export const checkUser= async(user)=>{
  try{
    const [result] = await connection.promise().query('SELECT * from users where `userId` = ? or `userEmail` = ? or `userNickName` = ?',[user,user,user]);
    if(result.length==1){
      return result;
    }
    else{
      return false;
    }
  }
  catch(err){
    console.log(err);
    return undefined
  }
}

export const createUser = async(user)=>{
  try{
    const [result] = await connection.promise().query('insert into users(userId,userName,userNickName,userPassword,userEmail,createDate) values (uuid(),?,?,?,?,utc_timestamp())',[
        user.userName,
        user.userNickName,
        user.userPassword,
        user.userEmail,
      ])
    ;

    if(result.affectedRows>=1){
      const [userUUID] = await connection.promise().query('select userId from users where userNickName = ?',[
        user.userNickName,
      ])
      if(userUUID.length == 1){
        return userUUID
      }
      else{
        return false
      }
    }
    else{
      return false
    }
  }
  catch(err){
    console.log(err);
    return undefined
  }
}