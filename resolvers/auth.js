import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { UserInputError } from 'apollo-server-express';
import { generateToken } from '../utils.js';

const authResolver = {
  Mutation: {
    async login(_, { email, password }) {
      const user = await User.findOne({ email: email }).lean();
      if (!user) throw new UserInputError('هذا الحساب غير موجود لدينا!!');

      const isEqual = await bcrypt.compare(password, user.password);

      if (!isEqual)
        throw new UserInputError('خطأ في البريد الإلكتروني أو كلمة المرور!!');

      return {
        email: user.email,
        name: user.name,
        _id: user._id,
        likes: user.likes,
        token: generateToken(user),
      };
    },

    async createUser(_, { userInput }) {
      try {
        const existingUser = await User.findOne({
          email: userInput.email,
        });
        if (existingUser) {
          throw new UserInputError('!!هذا الحساب موجود مسبقًا لدينا', {
            invalidUserInput: userInput.email,
          });
        }

        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = new User({
          ...userInput,
          password: hashedPassword,
        });
        await user.save();
        return {
          token: generateToken(user),
          name: user.name,
          email: user.email,
        };
      } catch (err) {
        throw err;
      }
    },
  },
};

export default authResolver;
