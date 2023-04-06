import { isEqualObject, isLoggedIn } from '../utils.js';
import { combineResolvers } from 'graphql-resolvers';
import Post from '../models/post.js';
import User from '../models/user.js';
import { PubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';

import { createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { resolve } from 'path';
import graphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

const pubsub = new PubSub();

const __dirname = resolve();

const postResolver = {
  Upload: graphQLUpload, //Resolves the `Upload` scalar
  Query: {
    async posts(_, __, { user }) {
      const posts = await Post.find().lean();
      if (!posts) throw new Error('لم يتم ايجاد المنشورات');

      return posts;
    },
    getMyPosts: combineResolvers(isLoggedIn, async (_, __, { user }) => {
      const posts = await Post.find({ creator: user._id });
      if (!posts) throw new Error('لم يتم ايجاد المنشورات لك');

      return posts;
    }),
    async getUserPosts(_, { userId }) {
      const posts = await Post.find({ creator: userId });

      if (!posts) throw new Error('لم يتم ايجاد المنشورات لك');

      return posts;
    },
    async getPost(_, { postId }) {
      const post = await Post.findById(postId);

      if (!post) throw new Error('لم يتم ايجاد المنشور');

      return post;
    },
  },

  Mutation: {
    createPost: combineResolvers(
      isLoggedIn,
      async (_, { postInput }, { user }) => {
        try {
          const { createReadStream, filename } = await postInput.file;
          const stream = createReadStream();
          const nameId = uuidv4() + '_' + filename;
          const pathName = join(__dirname, `./uploads/${nameId}`);
          await stream.pipe(createWriteStream(pathName));
          const post = await Post.create({
            ...postInput,
            image: nameId,
            likesNumber: 0,
            creator: user._id,
          });
          pubsub.publish('POST_ADDED', {
            postAdded: post,
          });

          return post;
        } catch (e) {
          throw new Error(e);
        }
      }
    ),

    updatePost: combineResolvers(
      isLoggedIn,
      async (_, { postId, postInput }, { user }) => {
        const post = await Post.findOne({
          _id: postId,
          creator: user._id,
        });
        if (!post) throw new Error('لا تملك الصلاحية لهذا المنشور');

        const { createReadStream, filename } = await postInput.file;
        const nameId = uuidv4() + '_' + filename;
        const stream = createReadStream();
        const pathName = join(__dirname, `./uploads/${nameId}`);
        await stream.pipe(createWriteStream(pathName));
        const pathDeleted = join(__dirname, `./uploads/${post.image}`);

        unlink(pathDeleted, () => {});
        post.image = nameId;
        post.title = postInput.title;
        post.description = postInput.description;

        await post.save();

        return post;
      }
    ),
    updatePostWithoutImage: combineResolvers(
      isLoggedIn,
      async (_, { postId, title, description }, { user }) => {
        const post = await Post.findOne({
          _id: postId,
          creator: user._id,
        });
        if (!post) throw new Error('لا تملك الصلاحية لهذا المنشور');

        post.title = title;
        post.description = description;

        await post.save();

        return post;
      }
    ),
    deletePost: combineResolvers(
      isLoggedIn,
      async (_, { postId, postImage }, { user }) => {
        try {
          await Post.findOneAndDelete({
            _id: postId,
            creator: user._id,
          });
          const pathDeleted = join(__dirname, `./uploads/${postImage}`);

          unlink(pathDeleted, () => {});
          return { message: 'deleted ' };
        } catch (e) {
          throw new Error(e);
        }
      }
    ),
    likePost: combineResolvers(isLoggedIn, async (_, { postId }, { user }) => {
      let message, isEqual;
      const findPost = Post.findById(postId);
      const finedUser = User.findById(user._id);
      const post = await findPost;
      const userDB = await finedUser;

      userDB?.likes?.forEach((item) =>
        isEqualObject(item.post, post._id)
          ? (isEqual = true)
          : (isEqual = false)
      );
      if (isEqual) {
        userDB.likes = userDB.likes?.filter(
          (item) => !isEqualObject(item.post, post._id)
        );
        post.likes = post.likes?.filter(
          (item) => !isEqualObject(item.user, userDB._id)
        );
        message = 'like remove';
      } else {
        post.likes.push({ user: userDB._id });
        userDB.likes.push({ post: post._id });
        message = 'like added';
      }
      post.likesNumber = post.likes.length;
      await post.save();
      await userDB.save();

      return { message };
    }),
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(['POST_ADDED']),
    },
  },
};

export default postResolver;
