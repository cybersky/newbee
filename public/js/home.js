/**
 * Created by zhaohailong on 12/15/15.
 */


$(function () {
    $('#caseForm').on('submit', function (evt) {
        var caseType = $('#caseType').val();
        var serviceType = $('#serviceType').val();
        var caseDesc = $('#caseDesc').val();
        var caseTarget = $('#caseTarget').val();
        var price1 = $('#price1').val();
        var price2 = $('#price2').val();

        $.post('/va/user/cases',
            {
                caseType: caseType,
                serviceType: serviceType,
                caseDesc: caseDesc,
                caseTarget: caseTarget,
                price1: price1,
                price2: price2
            }, function (data) {
                if(data.rtn){
                    alert(data.message);
                }
                $.mobile.loading('hide');
            });

        $.mobile.loading('show', {text: "努力加载中，请稍后...", textVisible: true});

        return false;
    });
});


var createCase = function () {


};