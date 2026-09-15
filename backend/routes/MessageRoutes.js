import express from "express";
import { 
    sendmessagecontrollor, 
    getmessagecontrollor, 
    getGlobalTimelineController, 
    getRegisteredUsersController, 
    getTodaysMessagesController
} from "../controllers/messageControllor.js";
import { isAuthenticated } from "../middleware/authmiddleware.js";

const router = express.Router();
router.route("/sendmessage/:id").post(isAuthenticated, sendmessagecontrollor);
router.route("/receivemessage/:id").get(isAuthenticated, getmessagecontrollor);
router.route("/allmessages").get(isAuthenticated, getGlobalTimelineController);
router.route("/allloggedin").get(isAuthenticated, getRegisteredUsersController);
router.route("/today").get(isAuthenticated, getTodaysMessagesController);

export default router;


