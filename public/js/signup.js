/**
 * Created by zhaohailong on 12/9/15.
 */
$(function(){
    $('#getVerifyCode').click(function(){
        var mobile = $('#inputMobile').val();
        if(!/\d{11}/.test(mobile)) return alert('请输入正确的手机号');
        $.post('/ua/voicecode', {mobile:mobile}, function(data, status){
            if(data&& data.rtn > 0) alert('error'+data.message);
        });
    });
});

var submitMobile = function(){

    var mobile = $('#inputMobile').val();
    var code = $('#inputCode').val();
    if(!/^\d{11}$/.test(mobile)){
        alert('请输入正确的手机号');
        return false;
    }
    if(!/^\d{4}$/.test(code)) {
        alert('请输入正确的验证码');
        return false;
    }

    $.post('/va/user/bindmobile', {mobile:mobile, code:code}, function(data, status){
        if(data && data.rtn > 0) return alert(data.message);
        window.location = '/wp/user/home';
    });

    return false;
};
