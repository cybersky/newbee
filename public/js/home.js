




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

    window.vmCaseForm = new Vue({
        el: 'form#caseForm',

        data: {
            caseType:'',
            serviceType:'',
            caseDesc:'',
            caseTarget:'',
            price1:'',
            price2:'',
            reportLocation:false,
            localImageIds:[],
            localVoiceIds:[]
        },

        methods:{
            submitCase:function(event){
                var body = {
                    caseType: this.caseType,
                    serviceType: this.serviceType,
                    caseDesc: this.caseDesc,
                    caseTarget: this.caseTarget
                };

                var priceType = $('#priceType ul li.ui-state-active a').data('priceType');

                switch (priceType){
                    case 1:
                        body.price1 = $('#price1').val();
                        if(!(body.price1 > 0)){
                            alert('没有悬赏金额不行哦');
                            return false;
                        }
                        break;
                    case 2:
                        body.price2 = $('#price2').val();
                        if(!(body.price2 > 0)){
                            alert('没有悬赏比例不行哦');
                            return false;
                        }
                        break;
                }


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
            },
            reportLocation:function () {
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
            },
            getNetworkType:function () {
                wx.getNetworkType({
                    success: function (res) {
                        var networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
                        alert('network:' + networkType);
                    }
                });
            },
            openImage:function(){
                var self = this;
                wx.chooseImage({
                    count: 9, // 默认9
                    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                    success: function (res) {
                        self.localImageIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                    }
                });
            },
            uploadImage:function(localIds){
                var self = this;
                wx.uploadImage({
                    localId: '', // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function (res) {
                        self.serverId = res.serverId; // 返回图片的服务器端ID
                    }
                });
            },
            downloadImage:function(){
                wx.downloadImage({
                    serverId: '', // 需要下载的图片的服务器端ID，由uploadImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function (res) {
                        var localId = res.localId; // 返回图片下载后的本地ID
                    }
                });
            },
            startRecord:function(){
                wx.startRecord();
                wx.onVoiceRecordEnd({
                    // 录音时间超过一分钟没有停止的时候会执行 complete 回调
                    complete: function (res) {
                        var localId = res.localId;
                    }
                });
            },
            stopRecord:function(){
                wx.stopRecord({
                    success: function (res) {
                        var localId = res.localId;
                    }
                });
            },
            playRecord:function(){
                wx.playVoice({
                    localId: '' // 需要播放的音频的本地ID，由stopRecord接口获得
                });
            }

        }
    });

    var loadUserCases = function(){

    };

    var loadUserLawyers = function(){

    };


    $("#page1").on("pageshow", loadUserCases);
    $("#page2").on("pageshow", loadUserLawyers);

    $('#testButton').on('click', function () {
        $.mobile.navigate('#pCaseOK');
    });

    $(window).on("navigate", function (event, data) {
        console.log(data.state.info);
        console.log(data.state.direction);
        console.log(data.state.url);
        console.log(data.state.hash);
    });
});
