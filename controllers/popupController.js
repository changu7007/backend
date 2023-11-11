import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import popUpModel from "../models/popUpModel.js";

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

const uploadToS3 = async (file) => {
  const fileContent = fs.createReadStream(file.filepath);
  const photoName = randomImageName();
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `popUpBanner/${photoName}`,
    Body: fileContent,
    ContentType: file.mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
  fs.unlinkSync(file.filepath); // clean up the temporary file
  return `https://d26jxww88dzshe.cloudfront.net/popUpBanner/${photoName}`;
};

export const postPopUpBanner = async (req, res) => {
  const photo = req.files && req.files.photo ? req.files.photo[0] : null;
  try {
    const newPopUpBanner = new popUpModel({ ...req.fields });

    if (photo) {
      newPopUpBanner.url = await uploadToS3(photo);
    }

    await newPopUpBanner.save();
    res.status(201).send({
      success: true,
      message: "Pop Up Banner Created Successfully",
      popUpBanner: newPopUpBanner,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Something Went Wrong While working With Pop Up Banner",
    });
  }
};

export const updatePopUpBanner = async (req, res) => {
  try {
    const updatePopUpBanner = await popUpModel.findByIdAndUpdate(
      req.params.bid,
      { ...req.fields },
      { new: true }
    );

    if (req.files.photo) {
      const photo = req.files.photo[0];
      updatePopUpBanner.url = await uploadToS3(photo);
    }

    await updatePopUpBanner.save();
    res.status(201).send({
      success: true,
      message: "Pop Up Banner Updated Successfully",
      updatePopUpBanner,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "Something Went Wrong While working With Banner",
    });
  }
};

export const getAllPopUpBanner = async (req, res) => {
  try {
    const popUpBanner = await popUpModel.find({});
    res.status(200).send({ success: true, popUpBanner });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
      message: "error while fetching popUpBanner",
    });
  }
};

export const getPopUpBannerById = async (req, res) => {
  try {
    const popUpBanner = await popUpModel.findById(req.params.bid);
    if (!popUpBanner) {
      return res.status(404).send({
        success: false,
        message: "popUpBanner Not Found",
      });
    }
    res.status(200).send({ success: true, popUpBanner });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "error while getting banner" });
  }
};

export const deletePopUpBannerById = async (req, res) => {
  try {
    const deletedPopUpBanner = await popUpModel.findByIdAndDelete(
      req.params.bid
    );

    if (!deletedPopUpBanner) {
      return res.status(404).send({
        success: false,
        message: "Banner Not Found",
      });
    }

    res.status(201).send({
      success: true,
      message: "Banner Deleted",
      deleted: deletedPopUpBanner,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, error, message: "Error while deleting banner" });
  }
};

export const popUpStatusController = async (req, res) => {
  try {
    const id = req.params.bid;
    const { publish } = req.body;
    console.log(id, publish);

    const popupbanner = await popUpModel.findByIdAndUpdate(
      id,
      { publish },
      { new: true }
    );

    res.status(200).send({ success: true, message: "updated", popupbanner });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};
