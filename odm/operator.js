/**
 * Created by Daniels on 10/28/15.
 */

var Operator  = require('../model/operator').Operator;


exports.createOperator = (operatorInfo, callback) => {
    var operator = new Operator(operatorInfo);
    return operator.save((err, docs, effected) => {
        if(err) return callback(err);
        if(docs.password) delete docs._doc.password;
        return callback(null, docs, effected);
    });
};

exports.getOperator = () => {};
exports.getOperatorById = () => {};
exports.getOperatorByCondition = () => {};
exports.operatorCount = () => {};
exports.getOperators= () => {};
exports.deleteOperator = () => {};
exports.updateOperator = () => {};