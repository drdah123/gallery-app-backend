import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export function isLoggedIn(parent, args, { user }, info) {
  if (!user) {
    throw new Error('يجب تسجيل دخولك!!');
  }
}

export function isEqualObject(firstO, secondO) {
  return JSON.stringify(firstO) === JSON.stringify(secondO);
}
export function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export default generateToken;
