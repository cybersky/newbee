/**
 * Created by Daniels on 10/22/15.
 */

module.exports = exports.pre = (req, res, next) => {
    res.set("x-powered-by", "NewBee");
    return next();
};