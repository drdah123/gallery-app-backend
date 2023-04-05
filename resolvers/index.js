import auth from './auth.js';
import post from './post.js';
import merge from 'lodash';

const resolvers = merge.merge(auth, post);
export default resolvers;
