/**
 * Created by zhaohailong on 12/9/15.
 */
$(function(){
    $('#getVerifyCode').click(function(){
        var mobile = $('#inputMobile').val();
        if(!/\d{11}/.test(mobile)) return alert('请输入正确的手机号');

        $('#getVerifyCode').prop('disabled', true);
        $('#getVerifyCode').val('10分钟内有效，请注意接收');

        setInterval(function(){

        }, 60*1000);

        $.post('/ua/voicecode', {mobile:mobile}, function(data, status){
            if(data&& data.rtn > 0) alert('error'+data.message);
        });
    });
});

var submitMobile = function(){

    var mobile = $('#inputMobile').val();
    var code = $('#inputCode').val();
    var name = $('#inputName').val();

    if(!/^\d{11}$/.test(mobile)){
        alert('请输入正确的手机号');
        return false;
    }
    if(!/^\d{4}$/.test(code)) {
        alert('请输入正确的验证码');
        return false;
    }

    if(!name){
        alert('请输入您的称谓');
        return false;
    }

    $.post('/va/user/bindmobile', {mobile:mobile, code:code, name:name}, function(data, status){
        if(data && data.rtn > 0) return alert(data.message);
        window.location = '/wp/user/home';
    });

    return false;
};
