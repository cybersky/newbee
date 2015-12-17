/**
 * Created by zhaohailong on 12/15/15.
 */

var clearRaiseCase = function(){

};

var loadUserCases = function(){

};

var loadUserLawyers = function(){

};



$(function () {

    $( "#page1" ).on( "pageshow", loadUserCases);
    $( "#page2" ).on( "pageshow", loadUserLawyers);

    $('#testButton').on('click', function(){
        $.mobile.navigate('#pCaseOK');
    });

    $('#caseForm').on('submit', function (evt) {
        var caseType = $('#caseType').val();
        var serviceType = $('#serviceType').val();
        var caseDesc = $('#caseDesc').val();
        var caseTarget = $('#caseTarget').val();
        var price1 = $('#price1').val();
        var price2 = $('#price2').val();
        var self = this;

        $.post('/va/user/cases',
            {
                caseType: caseType,
                serviceType: serviceType,
                caseDesc: caseDesc,
                caseTarget: caseTarget,
                price1: price1,
                price2: price2
            }, function (data) {
                $.mobile.loading('hide');
                if(data.rtn > 0) return alert(data.message);
                clearRaiseCase();
                $.mobile.navigate('#page1')
            });

        $.mobile.loading('show', {text: "努力加载中，请稍后...", textVisible: true});

        return false;
    });

    $( window ).on( "navigate", function( event, data ) {
        console.log( data.state.info );
        console.log( data.state.direction );
        console.log( data.state.url );
        console.log( data.state.hash );
    });
});

