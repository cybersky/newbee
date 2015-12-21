/**
 * Created by zhaohailong on 12/15/15.
 */

var clearRaiseCase = function () {

};

var loadUserCases = function () {

};

var loadUserLawyers = function () {

};


$(function () {

    $.get('/va/user/jsconfig', function (data) {
        if (data.rtn && data.rtn > 0) return alert('error: ' + data.message);
        wx.config(data.data.config);

        wx.ready(function () {
            //console.log('jsconfig ok');
        });
        wx.error(function (res) {
            //console.log('something wrong with jssdk api: ' + JSON.stringify(res));
        });
    });

    $('#getNetworkButton').on('click', function () {
        wx.getNetworkType({
            success: function (res) {
                var networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
                alert('network:' + networkType);
            }
        });
    });

    $('#reportLocation').on('click', function () {
        wx.getLocation({
            type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
            success: function (res) {
                var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                var speed = res.speed; // 速度，以米/每秒计
                var accuracy = res.accuracy; // 位置精度

                window.nbLocation = {lon: longitude, lat: latitude, speed: speed, accuracy: accuracy};
                //alert('lon' + longitude + ',lat' + latitude);
            }
        });
    });

    $("#page1").on("pageshow", loadUserCases);
    $("#page2").on("pageshow", loadUserLawyers);

    $('#testButton').on('click', function () {
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

        var body = {
            caseType: caseType,
            serviceType: serviceType,
            caseDesc: caseDesc,
            caseTarget: caseTarget,
            price1: price1,
            price2: price2
        };

        if(window.nbLocation && window.nbLocation.lon) body.lon = window.nbLocation.lon;
        if(window.nbLocation && window.nbLocation.lat) body.lat = window.nbLocation.lat;

        $.post('/va/user/cases', body
            , function (data) {
                $.mobile.loading('hide');
                if (data.rtn > 0) return alert(data.message);
                clearRaiseCase();
                $.mobile.navigate('#page1')
            });

        $.mobile.loading('show', {text: "努力加载中，请稍后...", textVisible: true});

        return false;
    });

    $(window).on("navigate", function (event, data) {
        console.log(data.state.info);
        console.log(data.state.direction);
        console.log(data.state.url);
        console.log(data.state.hash);
    });
});
