/**
 * Created by Daniels on 10/28/15.
 */
var encaseDialog = function (opts) {
    // Using init options
    return new BootstrapDialog(opts);
};

var successTip = errorTip = function (message, timeout, forceRefresh, href) {
    forceRefresh = forceRefresh || false;
    timeout = timeout || (5 * 1000);
    var msg = {code: 0};
    if (message) {//success
        try {
            msg = message;
            if (!_.isObject(message)) {
                msg = JSON.parse(message);
            }
        } catch (error) {
            msg = {code: 0, message: message};
        }
    }
    var dialog = encaseDialog({title: '提示', message: ''});
    if(msg.rtn) msg.code = msg.rtn;
    if ((msg.code && msg.code != 0) || (msg.err && msg.err != 0)) {
        dialog.setMessage(msg.message || '未知错误[Unknown error]');
        dialog.setType(BootstrapDialog.TYPE_DANGER);
        dialog.open();
    } else {
        dialog.setMessage(msg.message || '成功!');
        dialog.setType(BootstrapDialog.TYPE_SUCCESS);
        dialog.open();
    }
    setTimeout(function () {
        //closing tip window
        dialog.close();

        //force refresh
        if (forceRefresh) window.location.href = href || window.location.href;
    }, timeout);
};

var deliverMessageToNotice = function(elementId, message, timeout){
    var el = document.getElementById(elementId);
    el.innerHTML = message || '';
    setTimeout(function(){
        el.innerHTML = '';
    }, timeout || 1000 * 3);
};