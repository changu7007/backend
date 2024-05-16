import { SitemapStream } from "sitemap";
import productModel from "../models/productModel.js";

import fs, { createWriteStream } from "fs";
import path from "path";
import blogModel from "../models/blogModel.js";
import categoryModel from "../models/categoryModel.js";

const generateSitemaps = async () => {
  try {
    // Fetch products from the database
    const products = await productModel.find().lean().populate("category");
    const blogs = await blogModel.find().lean();
    const categories = await categoryModel.find().lean();

    const sitemapItems = [
      { url: "", priority: 1 },
      { url: "aboutus" },
      { url: "contactus" },
      { url: "reviews" },
      { url: "shippingAndDelivery" },
      { url: "all-products" },
      { url: "blogs" },
      // Map products to sitemap items
      ...products.map((product) => ({
        url: `${product.category?.slug}/${product.slug}`,
        changefreq: "daily",
        lastmod: product.updatedAt,
      })),
      ...blogs.map((blog) => ({
        url: `blogs/${blog._id}/${blog.slug}`,
        changefreq: "daily",
        lastmod: blog.updatedAt,
      })),
      ...categories.map((cateory) => ({
        url: `${cateory.slug}`,
        changefreq: "daily",
        lastmod: cateory.updatedAt,
      })),
    ];

    const sitemapStream = new SitemapStream({
      hostname: "https://divinecoorgcoffee.co.in",
    });
    const writePath = path.resolve("./client/build", "sitemap.xml");
    const writeStream = fs.createWriteStream(writePath);

    sitemapStream.pipe(writeStream);
    sitemapItems.forEach((url) => sitemapStream.write(url));
    sitemapStream.end();

    // Wait for the stream to finish writing
    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        resolve();
      });
      writeStream.on("error", (error) => {
        console.error("Error generating sitemap:", error);
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

export default generateSitemaps;
