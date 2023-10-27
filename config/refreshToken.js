import JWT from "jsonwebtoken";

export const generateRefreshToken = (id) => {
  return JWT.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};
