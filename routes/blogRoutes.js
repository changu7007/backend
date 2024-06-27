import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlog,
  getBlog,
  likeBlog,
  updateBlog,
  uploadPhoto,
} from "../controllers/blogController.js";
import { isAdmin, requireSignIn } from "../middelware/authMiddleware.js";
import formidableMiddleware from "../middelware/formidable.js";
const router = express.Router();

router.post("/", requireSignIn, isAdmin, formidableMiddleware, createBlog);
router.post("/upload-photo", requireSignIn, isAdmin, uploadPhoto);
router.put("/likes", requireSignIn, likeBlog);
router.put("/:id", requireSignIn, isAdmin, formidableMiddleware, updateBlog);
router.get("/getblog/:id", getBlog);
router.get("/get-all-blogs", getAllBlog);
router.delete("/deleteblog/:id", requireSignIn, isAdmin, deleteBlog);

export default router;
