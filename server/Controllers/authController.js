import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
        const {name,email,password}=req.body;
    const existingUser = await User.findOne({ email });
    console.log("Login email:", email);
console.log("Found user:", existingUser);
        if (existingUser){
                return res.status(400).json({message:"User already exists"})
        }
        const hashedPassword = await bcrypt.hash(password,10);

        const newUser= await User.create({
                name,
                email,
                password:hashedPassword,
        });

         res.status(201).json({
                success:true,
                message: "User registered successfully",
                user:{
                        id:newUser.id,
                        name:newUser.name,
                        email:newUser.email,
                }
        })
}

export const login = async (req,res)=>{
        const {email,password}=req.body;

        const existingUser= await User.findOne({email})

        if (!existingUser){
               return res.status(400).json({
                success:false,
                message:"user doesnt exist"
               });
        }

        

        const isMatch = await bcrypt.compare(password,existingUser.password);

          if (!isMatch){
               return res.status(400).json({
                success:false,
                message: "Invalid email or password"
               });
        }


        const token =jwt.sign(
                {userId:existingUser._id},
                process.env.JWT_SECRET,
                {expiresIn :"7d"}
        )

        return res.status(200).json({
         success: true,
          message: "Login successful",
         token
        });
}