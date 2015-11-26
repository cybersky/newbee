

exports.createURL = function(urlPattern, options){
    if(!options ) return urlPattern;

    for(var key in options){
        var keyPattern = ['{{',key,'}}'].join('');
        urlPattern = urlPattern.replace(keyPattern, options[key]);
    }

    return urlPattern;
};