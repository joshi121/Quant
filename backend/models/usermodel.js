import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: [50, "name cannot exceed 50 characters"]
        },

        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please fill a valid email address"
            ]
        },

        password: {
            type: String,
            required: true,
            minLength: [10, "minimum 10 chracters required"]
        }

    }, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;

