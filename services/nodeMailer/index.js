import "dotenv/config"

import fs from 'fs'
import ejs from 'ejs'

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST ,
    port:  process.env.NODEMAILER_PORT,
    secure: true,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    },
});

export const sendMailNodeMailer = async(userMail,verificationLink) =>{

    var body = await fs.readFileSync(process.cwd() + '/view/register/sendVerificationMail.ejs','utf-8');
    const template = await ejs.render(body,{userMail:userMail,verificationLink:verificationLink})

    const options = {
        from: `Authentication <${process.env.NODEMAILER_USER}>`,
        to: userMail,
        subject: 'Sign up',
        html: template
    }

    try{
        const response = await transporter.sendMail(options)

        return response
    }
    catch(err){
        console.log(err,'err nodemailer')
        return null
    }


}