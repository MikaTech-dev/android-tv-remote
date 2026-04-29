import { Router } from "express";
import sendResponse from "../utils/response.middleware.js";
const router = Router()

router.get ("/", (req, res) => {
    sendResponse(res, 200, true, "Hi",)
})


export default router