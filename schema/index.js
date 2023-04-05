import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar Upload
  type Query {
    posts: [Post!]
    getPost(postId: ID!): [Post!]
    getUserPost(userId: ID!): [Post!]
    getMyPosts: [Post!]
    getUserPosts(userId: ID!): [Post!]
  }

  type UserLike {
    post: ID!
    _id: ID!
  }

  type AuthData {
    email: String!
    token: String!
    name: String!
    _id: ID!
    likes: [UserLike!]
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    password: String!
  }

  input UserInput {
    name: String!
    email: String!
    password: String!
  }

  type Post {
    _id: ID!
    image: String!
    title: String!
    description: String!
    likesNumber: Float!
    creator: User!
    isUserLike: Boolean!
  }
  type Message {
    message: String!
  }
  type Mutation {
    createUser(userInput: UserInput!): AuthData
    login(email: String!, password: String!): AuthData

    createPost(postInput: PostInput!): Post!
    deletePost(postId: ID!): Message!
    updatePost(postId: ID!, postInput: PostInput!): Post
    likePost(postId: ID!): Message!
    # cancelLike(postId: ID!): Post
  }

  input PostInput {
    file: Upload!
    title: String!
    description: String!
  }

  type Subscription {
    postAdded: Post!
    # likeAdded: Post!
  }
`;

export default typeDefs;
