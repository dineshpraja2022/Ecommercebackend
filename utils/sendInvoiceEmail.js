// sendInvoiceEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendInvoiceEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Shri Shivay Textiles" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
