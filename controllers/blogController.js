import blogModel from "../models/blogModel.js";
import userModel from "../models/userModel.js";

export const createBlog = async (req, res) => {
  try {
    const blog = await blogModel.create(req.body);
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
  try {
    const updateBlog = await blogModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
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
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const getAllBlog = async (req, res) => {
  try {
    const getAllBlogs = await blogModel.find();
    res.json(getAllBlogs);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
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
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro in Category",
    });
  }
};

export const likeBlog = async (req, res) => {
    console.log(req.body)
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
