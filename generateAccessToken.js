const jwt = require("jsonwebtoken")
function generateAccessToken(user) {
    return jwt.sign(user, "123456", { expiresIn: "15m" })
}
module.exports = generateAccessToken

