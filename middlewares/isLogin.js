const { AuthenticationError } = require('apollo-server-express')

const isLoggedin = (parent, args, { user }, info) => {
    if (!user) {
        throw new AuthenticationError("يجب تسجيل دخولك!!")
    }
}

module.exports = { isLoggedin }