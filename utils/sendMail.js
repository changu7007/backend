import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendMail = async ({ email, subject, template, data }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZH_MAIL_ORDERS,
      pass: process.env.ZH_PASS_ORDERS,
    },
  });

  const templatePath = path.join(__dirname, "../emails", template);

  const html = await ejs.renderFile(templatePath, data);
  const mailOptions = {
    from: `"Divine Coorg Coffee" <${process.env.ZH_MAIL_ORDERS}>`,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

export default sendMail;
