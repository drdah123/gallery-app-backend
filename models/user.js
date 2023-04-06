import mongoose from 'mongoose';
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    likes: [
      {
        post: {
          type: Schema.Types.ObjectId,
          ref: 'Post',
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
const Post = mongoose.model('User', userSchema);
export default Post;
