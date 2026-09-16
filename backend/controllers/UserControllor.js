    import User from "../models/usermodel.js"
    import bcrypt from "bcryptjs"
    import jwt from "jsonwebtoken"
    import logger from "../utils/logger.js";


    const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

    const generateToken_Cookie = (userId, res)=>{
        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || "supersecretkey12345";
        const token = jwt.sign({id: userId}, secret, {expiresIn : "1d"});
        res.cookie("token" , token, {
            httpOnly: true,
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction ? true : false,
        });
    };

    export const Register = async (req , res) =>{
        try{
            const  { name , email , password }=  req.body;
            if(!name || !email || !password){
                return res.status(400).json({
                    message: " all input fields are required "
                });
            }
            const userExists = await User.findOne({ email });

            if (userExists) {
                return res.status(400).json({ message: "Email is already registered" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword 
            });

            

            return res.status(201).json({
                message: "user registered successfully",
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email
                }
            });
        }
        catch(error){
            logger.error("Registrationfailed", { 
                errorMessage: error.message
                
            });

            return res.status(500).json({ message: "Internal server error" });
        }
    } 

    export const Login = async(req, res) =>{
        try{
            const {email , password} = req.body;
            if(!email || !password){
                console.log("[LOGIN FAIL]: Email or password missing in request body");
                return res.status(400).json({
                    message: "All input fields are required"
                });
            }

            const cleanEmail = String(email).toLowerCase().trim();
            const user = await User.findOne({ email: cleanEmail });

            if (!user) {
                console.log(`[LOGIN FAIL]: User with email '${cleanEmail}' not found in database.`);
                return res.status(400).json({ message: "Invalid email or password" });
            }

            const isMatched = await bcrypt.compare(password, user.password);
            if (!isMatched) {
                console.log(`[LOGIN FAIL]: Password mismatch for email '${cleanEmail}'.`);
                return res.status(400).json({ message: "Invalid email or password" });
            }

            console.log(`[LOGIN SUCCESS]: User '${cleanEmail}' logged in successfully.`);
            generateToken_Cookie(user._id , res);
            return res.status(200).json({
                message:"user logged in successfully",
                user :{
                    id : user._id,
                    name : user.name,
                    email : user.email
                }
            });
        }
        catch(error){
            logger.error("Login process faced some failure", { 
                errorMessage: error.message, 
                stack: error.stack
            });

            return res.status(500).json({ message: "Internal server error" });
        }
    }

    export const Logout = async (req , res)=>{
        try{
            const token = req.cookies.token;

            if (!token) {
                return res.status(400).json({
                    message: "You are already logged out"
                });
            }
            return res.status(200).cookie("token", "", { 
                    httpOnly: true,
                    maxAge: 0,
                    sameSite: isProduction ? "none" : "lax",
                    secure: isProduction ? true : false,
                }).json({
                    message: "User logged out successfully"
                });
        }catch(error){
            logger.error("Logout pipeline encountered a failure", { 
                errorMessage: error.message, 
            });
            return res.status(500).json({ message: "Internal server error" });
        }
    }
