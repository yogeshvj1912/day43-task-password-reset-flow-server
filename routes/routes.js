const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema")
const bcrypt = require("bcryptjs")
const authenticate = require("../middleware/authenticate")
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const keysecret = "harshpathakvijaybhaipathakharsh"
const ENV = require("dotenv").config()

// email config 

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    }
})

//for user registration

router.post("/register", async (req, res) => {
    const { fname, email, password, cpassword } = req.body;
    if (!fname || !email || !password || !cpassword) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
        const preuser = await userdb.findOne({ email: email });
        if (preuser) {
            res.status(422).json({ error: "This Email is Already Exist" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "Password and Confirm Password Not Match" })
        } else {
            const finalUser = new userdb({
                fname, email, password, cpassword
            });

            //here password hashing
            const storeData = await finalUser.save();

            res.status(201).json({ status: 201, storeData })

        }
    } catch (error) {
        res.status(422).json(error)
        console.log("catch block error")
    }
});

//user login

router.post("/login", async (req, res) => {
    // console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
        const userValid = await userdb.findOne({ email: email });

        if (userValid) {
            const isMatch = await bcrypt.compare(password, userValid.password);
            if (!isMatch) {
                res.status(422).json({ error: "invalid detail" })
            } else {
                //token generate
                const token = await userValid.generateAuthtoken();

                //cookie generate
                res.cookie("usercookie", token, {
                    expires: new Date(Date.now() + 9000000),
                    httpOnly: true
                });
                const result = {
                    userValid,
                    token
                }
                res.status(201).json({ status: 201, result })
            }
        }
    } catch (error) {

    }
})



//user valid
router.get("/validuser", authenticate, async (req, res) => {
    try {
        const ValidUserOne = await userdb.findOne({ _id: req.userId });
        res.status(201).json({ status: 201, ValidUserOne });
    } catch (error) {
        res.status(401).json({ status: 401, error });
    }


})



//user logout
router.get("/logout", authenticate, async (req, res) => {

    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });
        res.clearCookie("usercookie", { path: "/" });
        req.rootUser.save();
        res.status(201).json({ status: 201 })
    } catch (error) {
        res.status(401).json({ status: 401, error })
    }

});


// send email Link For reset Password
router.post("/sendpasswordlink",async(req,res)=>{


    const {email} = req.body;

    if(!email){
        res.status(401).json({status:401,message:"Enter Your Email"})
    }

    try {
        const userfind = await userdb.findOne({email:email});

        // token generate for reset password
        const token = jwt.sign({_id:userfind._id},keysecret,{
            expiresIn:"120s"
        });
        
        const setusertoken = await userdb.findByIdAndUpdate({_id:userfind._id},{verifytoken:token},{new:true});


        if(setusertoken){
            const mailOptions = {
                from:process.env.USER_EMAIL,
                to:email,
                subject:"Sending Email For password Reset",
                text:`This Link Valid For 2 MINUTES http://localhost:3000/forgotpassword/${userfind.id}/${setusertoken.verifytoken}`
            }

            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    // console.log("error",error);
                    res.status(401).json({status:401,message:"email not send"})
                }else{
                    // console.log("Email sent",info.response);
                    res.status(201).json({status:201,message:"Email sent Succsfully"})
                }
            })

        }

    } catch (error) {
        res.status(401).json({status:401,message:"invalid user"})
    }

});


   //varify user for forgot password time

   router.get("/forgotpassword/:id/:token",async(req,res)=>{
    const {id,token}= req.params;
    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        const verifyToken = jwt.verify(token,keysecret);
       
        if(validuser && verifyToken._id){
          res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
   })


//change password

router.post("/:id/:token",async(req,res)=>{
    const {id,token}= req.params;
    const {password} = req.body;
    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        const verifyToken = jwt.verify(token,keysecret);
        if(validuser && verifyToken._id){
           const newpassword= await bcrypt.hash(password,12)
           const setnewuserpass = await userdb.findByIdAndUpdate({_id:id},{password:newpassword});
           setnewuserpass.save();
           res.status(201).json({status:201,setnewuserpass})              
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
})

module.exports = router;
