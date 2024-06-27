import slugify from "slugify";
import blogModel from "../models/blogModel.js";
import dotenv from "dotenv";
import crypto from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

export const createBlog = async (req, res) => {
  try {
    const blog = await blogModel.create(req.fields);
    res.status(201).send({
      success: true,
      message: "new blog created",
      blog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const updateBlog = async (req, res) => {
  const { id } = req.params;
  const slug = slugify(req.fields.title);
  try {
    const updateBlog = await blogModel.findByIdAndUpdate(
      id,
      { ...req.fields, slug },

      {
        new: true,
      }
    );
    res.status(201).send({
      success: true,
      message: "Blog Updated",
      updateBlog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const getBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const getBlog = await blogModel.findById(id);
    if (!getBlog) {
      res.status(404).send({
        success: false,
        message: "No Blog Found",
      });
    }
    await blogModel.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      {
        new: true,
      }
    );
    res.status(201).send({
      success: true,
      message: "Get Blog",
      getBlog,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Something Went Wrong while fetching",
    });
  }
};

export const getAllBlog = async (req, res) => {
  try {
    const getAllBlogs = await blogModel.find();
    res.json(getAllBlogs);
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const uploadPhoto = async (req, res) => {
  const { type } = req.body;
  try {
    if (type) {
      const name = randomImageName();
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `blog/${name}`,
        ContentType: type,
      });
      const signedUrl = await getSignedUrl(s3, putObjectCommand, {
        expiresIn: 60,
      });

      res.json({
        url: signedUrl,
      });
    } else {
      res.status(404).send({ success: false, message: "Type Required" });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error Uploading Photo",
      error,
    });
  }
};

export const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteBlog = await blogModel.findByIdAndDelete(id);
    res.status(201).send({
      success: true,
      message: "Blog Deleted",
      deleteBlog,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const likeBlog = async (req, res) => {
  console.log(req.body);
  const { blogId } = req.body;
  const blog = await blogModel.findById(blogId);
  const loginUserId = req?.user?.id;
  const isLiked = blog.isLiked;
  //   const alreadyDisliked = blog?.dislikes?.find(
  //     userId => userId?.toString()=== loginUserId?.toString()
  //   )
  //   if (alreadyDisliked) {
  //     const blog = await blogModel.findByIdAndUpdate(
  //       blogId,
  //       {
  //         $pull: { dislikes: loginUserId },
  //         isDisLiked: false,
  //       },
  //       { new: true }
  //     );
  //     res.json(blog);
  //   }
  if (isLiked) {
    const blog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true }
    );
    res.json(blog);
  } else {
    const blog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true }
    );
    res.json(blog);
  }
};
