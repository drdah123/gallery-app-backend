import mongoose from 'mongoose';
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    image: { type: String, required: true },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    likes: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
    likesNumber: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
const Post = mongoose.model('Post', postSchema);

export default Post;
