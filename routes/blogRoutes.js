import express from "express";
import { createBlog, deleteBlog, getAllBlog, getBlog, likeBlog, updateBlog } from "../controllers/blogController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
const router = express.Router();

router.post("/",requireSignIn,isAdmin ,createBlog)
router.put("/likes",requireSignIn,likeBlog)
router.put("/:id",requireSignIn,isAdmin ,updateBlog)
router.get("/getblog/:id",getBlog)
router.get("/getblogs",getAllBlog)
router.delete("/deleteblog/:id",requireSignIn,isAdmin,deleteBlog)




export default router;