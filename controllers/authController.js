import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import dotenv from "dotenv";
import crypto from "crypto";
import { generateRefreshToken } from "../config/refreshToken.js";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import otpModel from "../models/otpModel.js";

dotenv.config();
const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
});

export const sendForm = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      purposeOfOrder,
      quantityRequired,
      tellUsMore,
    } = req.body;

    let fromMail = process.env.MAIL;
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromMail,
        pass: process.env.PASS,
      },
    });

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Mailgen",
        link: "https://mailgen.js/",
      },
    });

    let response = {
      body: {
        name: "Divine Coorg Coffee",
        intro: "New Bulk Order Request from the customer",
        table: {
          data: [
            {
              name: name,
              email: email,
              mobile: mobile,
              orderDetails: purposeOfOrder,
              quantity: quantityRequired,
              moreDetails: tellUsMore,
            },
          ],
        },
        outro: "Looking forward to here more about your business",
      },
    };
    let mail = MailGenerator.generate(response);

    let message = {
      from: email,
      to: fromMail,
      subject: "Bulk Order Request",
      html: mail,
    };
    transporter.sendMail(message);
    return res.status(201).json({
      msg: "Order request Sent Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error while sedning",
      error,
    });
  }
};

const sendForgotEmail = async (data, req, res) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZH_MAIL_SUPPORT,
      pass: process.env.ZH_PASS_SUPPORT,
    },
  });

  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Divine Coorg Coffee",
      link: "https://divinecoorgcoffee.com",
    },
  });

  let response = {
    body: {
      name: data.name,
      intro:
        "You have received this email because a password reset request for your account was received.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#DC4D2F",
          text: "Reset your password",
          link: data.url,
        },
      },
      outro:
        "Link is valid upto 10 minutes only and If you did not request a password reset, no further action is required on your part.",
    },
  };
  let mail = MailGenerator.generate(response);

  let message = {
    from: `"Divine Coorg Coffee" <${process.env.ZH_MAIL_SUPPORT}>`,
    to: data.to,
    subject: "Password Reset Link",
    html: mail,
  };
  transporter.sendMail(message);
};

export const registerController = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    //validations
    if (!name) {
      return res.send({ message: "Name is Required" });
    }
    if (!email) {
      return res.send({ message: "E-mail is Required" });
    }
    if (!phone) {
      return res.send({ message: "phone no. is Required" });
    }
    if (!password) {
      return res.send({ message: "password is Required" });
    }

    //checkUser
    const existingUser = await userModel.findOne({ email });
    //existing User
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Already Registered Please Login with email!",
      });
    }
    const existingPhone = await userModel.findOne({ phone });
    //existing User
    if (existingPhone) {
      return res.status(200).send({
        success: false,
        message: "Already Registered Please Login with Phone!",
      });
    }

    //registerUser
    const hashedPassword = await hashPassword(password);

    //save
    const user = await new userModel({
      name,
      email,
      phone,
      password: hashedPassword,
    }).save();
    res.status(200).send({
      success: true,
      message: "Registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error in Registration",
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "invalid email or password",
      });
    }
    //check user exist
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(404).send({
        success: false,
        message: "Invalid Password",
      });
    }

    //token
    const token = await generateRefreshToken(user?._id);

    const updateUser = await userModel.findByIdAndUpdate(
      user?._id,
      { refreshToken: token },
      { new: true }
    );
    res.cookie("refreshToken", token, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });

    res.status(200).send({
      success: true,
      message: "Login Successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        pincode: user.pincode,
        state: user.state,
        role: user.role,
      },
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login",
      error,
    });
  }
};

//send-phone-otp
export const sendPhoneOtp = async (req, res) => {
  const phoneNumber = req.body.phone;
  if (!phoneNumber) {
    return res.status(400).send({ error: "Phone number is required" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await hashPassword(otp);

  const params = {
    Message: `Your Divine Coorg Coffee login (OTP) is: ${otp}. Do not share this code with anyone.`,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      "AWS.SNS.SMS.SenderID": {
        DataType: "String",
        StringValue: "DCC-DIVINE",
      },
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional",
      },
    },
  };

  try {
    await snsClient.send(new PublishCommand(params));
    const otpdb = await new otpModel({
      phone: phoneNumber,
      otp: hashedOTP,
    }).save();
    res.status(200).send({
      success: true,
      message: "OTP sent successfully!",
      otpdb,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to send OTP" });
  }
};

//verify and login
export const verifyOtp = async (req, res) => {
  try {
    const otpHolder = await otpModel.findOne({
      phone: req.body.phone,
    });
    if (!otpHolder)
      return res
        .status(400)
        .send({ success: false, message: "Your Otp Has Expired" });
    const validate = await comparePassword(req.body.otp, otpHolder.otp);
    if (!validate) {
      return res.status(400).send({ success: false, message: "Incorrect Otp" });
    }
    const findUser = await userModel.findOne({ phone: req.body.phone });
    if (!findUser) {
      const createUser = await new userModel({
        phone: req.body.phone,
      }).save();
      createUser.refreshToken = generateRefreshToken(createUser._id);
      await createUser.save();
      res.status(200).send({
        success: true,
        message: "verified",
        user: createUser,
      });
    } else {
      const updateUser = await userModel.findByIdAndUpdate(
        findUser._id,
        { refreshToken: generateRefreshToken(findUser?._id) },
        { new: true }
      );
      res.status(200).send({
        success: true,
        message: "verified",
        user: updateUser,
      });
    }

    await otpModel.deleteMany({
      phone: req.body.phone,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ success: false, error: error, message: "Something Went Wrong" });
  }
};

export const forgotPasswordToken = async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send({
      success: false,
      message: "User Not found with this email",
    });
  }
  try {
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; //10min
    await user.save();
    const resetUrl = `http://divinecoorgcoffee.com/reset-password/${token}`;
    const data = {
      to: email,
      name: user.name,
      url: resetUrl,
    };
    sendForgotEmail(data);
    // res.json(token);
    res.status(200).send({
      success: true,
      message: "We have sent you an reset link to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went Wrong",
      error,
    });
  }
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const user = await userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Token Expired, Please Try Again later",
      });
    }
    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).send({
      success: true,
      message: "Password Changed Succesfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went Wrong",
      error,
    });
  }
};

//update-profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, phone, address, city, pincode, state } = req.body;
    const user = await userModel.findById(req.user.id);
    const uniqueEmail = await userModel.findOne({
      email: email,
      _id: { $ne: req.user.id },
    });
    if (uniqueEmail) {
      return res.status(400).send({
        success: false,
        message: "This email has registered with another account",
      });
    }
    //password
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        address: address || user.address,
        city: city || user.city,
        pincode: pincode || user.pincode,
        state: state || user.state,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

export const handleRefreshToken = async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    return res.status(400).send({
      success: false,
      message: "No refresh token in cookies",
    });
  }
  const refreshToken = cookie.refreshToken;
  const user = await userModel.findOne({ refreshToken });
  if (!user) {
    return res.status(400).send({
      success: false,
      message: "No refresh token present in db or not matched",
    });
  }
  JWT.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      return res.status(400).send({
        success: false,
        message: "Something wrong with refreshToken",
      });
    }
    const accessToken = generateRefreshToken(user?._id);
    res.json({ accessToken });
  });
};

export const logout = async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    return res.status(400).send({
      success: false,
      message: "No refresh token in cookies",
    });
  }
  const { refreshToken } = cookie.refreshToken;
  const user = await userModel.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204);
  }
  await userModel.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204);
};

export const getAllUsers = async (req, res) => {
  try {
    const getUsers = await userModel
      .find(req.query)
      .select("-password")
      .sort({ createdAt: "-1" });
    res.status(200).send({
      success: true,
      message: "Fetched All Users",
      getUsers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error in Fetching Users",
      error,
    });
  }
};
