import bannerModel from "../models/bannerModel.js";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import paymentModel from "../models/paymentModel.js";
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

const uploadToS3 = async (file, type) => {
  const fileContent = fs.createReadStream(file.filepath);
  const photoName = randomImageName();
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `banner/${photoName}`,
    Body: fileContent,
    ContentType: file.mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
  fs.unlinkSync(file.filepath); // clean up the temporary file
  return `https://d26jxww88dzshe.cloudfront.net/banner/${photoName}`;
};

export const postBanner = async (req, res) => {
  const desktop = req.files && req.files.desktop ? req.files.desktop[0] : null;
  const mobile = req.files && req.files.mobile ? req.files.mobile[0] : null;
  try {
    const newBanner = new bannerModel({ ...req.fields });

    if (desktop) {
      newBanner.bannerDekstopUrl = await uploadToS3(desktop, "desktop");
    }

    if (mobile) {
      newBanner.bannerMobileUrl = await uploadToS3(mobile, "mobile");
    }

    await newBanner.save();
    res.status(201).send({
      success: true,
      message: "Banner Created Successfully",
      banner: newBanner,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Something Went Wrong While working With Banner",
    });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const updateBanner = await bannerModel.findByIdAndUpdate(
      req.params.bid,
      { ...req.fields },
      { new: true }
    );

    if (req.files.desktop) {
      const desktop = req.files.desktop[0];
      updateBanner.bannerDekstopUrl = await uploadToS3(desktop, "desktop");
    }

    if (req.files.mobile) {
      const mobile = req.files.mobile[0];

      updateBanner.bannerMobileUrl = await uploadToS3(mobile, "mobile");
    }

    await updateBanner.save();
    res.status(201).send({
      success: true,
      message: "Banner Updated Successfully",
      updateBanner,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Something Went Wrong While working With Banner",
    });
  }
};

export const getAllBanner = async (req, res) => {
  try {
    const banners = await bannerModel.find({});
    res.status(200).send({ success: true, banners });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "error while fetching banners" });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const banner = await bannerModel.findById(req.params.bid);
    if (!banner) {
      return res.status(404).send({
        success: false,
        message: "Banner Not Found",
      });
    }
    res.status(200).send({ success: true, banner });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "error while getting banner" });
  }
};

export const deleteBannerById = async (req, res) => {
  try {
    const deletedBanner = await bannerModel.findByIdAndDelete(req.params.bid);

    if (!deletedBanner) {
      return res.status(404).send({
        success: false,
        message: "Banner Not Found",
      });
    }

    res.status(201).send({
      success: true,
      message: "Banner Deleted",
      deleted: deletedBanner,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "Error while deleting banner" });
  }
};

export const getAllStatus = async (req, res) => {
  try {
    const getStates = await paymentModel.find({});
    res.status(201).send({
      success: true,
      message: "Fetched All States",
      getStates,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "Error while fetching Satuts" });
  }
};

export const updateStatus = async (req, res) => {
  const { cod, phonePe, razorpay } = req.body;

  try {
    const getStates = await paymentModel.findByIdAndUpdate(
      req.params.id,
      {
        cod: cod,
        phonePe: phonePe,
        razorpay: razorpay,
      },
      { new: true }
    );

    res.status(201).send({
      success: true,
      message: "Status Updated",
      getStates,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "Error while fetching Satuts" });
  }
};
