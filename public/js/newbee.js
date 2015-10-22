/**
 * Created by Daniels on 10/19/15.
 */



var SignUp = {create: 'POST /ua/user/signup'};
var SignIn = {auth: 'POST /ua/user/signin'};

var SignUpModel = new Model(SignUp);
var SignInModel = new Model(SignIn);
var dataModel = {
    'signup': {model: SignUpModel, view: '#signupDiv', post: '/ua/user/signup'},
    'signin': {model: SignInModel, view: '#signinDiv', post: '/ua/user/signin'}
};


$(function(){
    var encaseDialog = function (opts) {
        // Using init options
        return new BootstrapDialog(opts);
    };

    var successTip = errorTip = function (message, timeout, forceRefresh) {
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
            if (forceRefresh) window.location.href = window.location.href;
        }, timeout);
    };

    var deliverMessageToNotice = function(elementId, message, timeout){
        var el = document.getElementById(elementId);
        el.innerHTML = message || '';
        setTimeout(function(){
            el.innerHTML = '';
        }, timeout || 1000 * 3);
    };

    var target = window.options.target || '';
    if (!target) return false;
    var profile = dataModel[target];

    profile.vue =  new Vue({
        el      : profile.view,
        data    : {
            contents : [],
            current  : {},
            pageSize : 10,
            total    : 0,
            page     : 0,
            sort     : {},
            modelName: window.options.target,
            model    : profile.model,
            ctn      : {},
            selected : 0
        },
        methods : {
            refreshModel     : function (page) {
                page = page || 0;
                var self = this;

                options.start = page * this.pageSize;
                options.rows  = this.pageSize;

                var params = {};
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        params[key] = options[key];
                    }
                }
                /*
                this.model.findAll(params, function (result) {
                    var cm   = [];
                    var list = result.data;
                    for (var i = 0, length = list.length; i < length; i++) {
                        cm.push(list[i]);
                    }
                    self.contents = cm;
                    self.total    = result.total || 0;
                    self.page     = page;
                }, function (xhr) {
                    errorTip(xhr.responseText);
                });*/
            },
            onSign_in : function(){
                var email = $('#inputEmail').val();
                if(!email) {
                    return deliverMessageToNotice('emailNotice', '邮箱地址不能为空', 1000 * 5);
                }
                if(!validator.isEmail(email)) {
                    return deliverMessageToNotice('emailNotice', '邮箱格式错误', 1000 * 5);
                }
                var pass  = $('#inputPassword').val();
                if(!pass){
                    return deliverMessageToNotice('passwordNotice', '密码不能为空', 1000 * 5);
                }

                var self = this;
                var nc = new this.model({email: email, password: pass});
                nc.authenticate(function(result){
                    if(result.refer) return self.redirect(result.refer);
                    self.redirect('/');
                });

            },
            onSign_up : function () {
                var formData = new FormData();
                var email = $('#email').val();
                if(!validator.isEmail(email)) return errorTip({code: 1, message: '邮箱格式错误'});
                var password = $('#password').val();
                var c_password = $('#cpassword').val();
                if(password != c_password) return errorTip({code: 1 , message: '两次密码不一致'});

                var phone = $('#phoneNumber').val();
                if(!validator.isMobilePhone(phone, 'zh-CN')) return errorTip({code: 1, message: '手机号码格式错误'});

                var data = {
                    username : $('#username').val(), password: password, email: email,
                    phoneNumber:phone ,
                    identityNumber:  $('#identityNumber').val(),
                    identityImage : document.getElementById('identityImage').files[0],
                    lawyerId: $('#lawyerId').val(),
                    lawyerLocation: $('#lawyerLocation').val(),
                    lawServiceArea: $('#lawServiceArea').val(),
                    lawyerIdImage: document.getElementById('lawyerIdImage').files[0]
                };

                for (var key in data) {
                    if (!data[key]) return errorTip({code: 1, message: 'Params error'});
                    formData.append(key, data[key]);
                }

                var self   = this;
                var xhr    = new XMLHttpRequest();
                xhr.open("POST", profile.post, true);
                xhr.onload = function () {

                    try {
                        var res = typeof this.responseText === 'string' ? JSON.parse(this.responseText) : this.responseText;
                    } catch (e) {
                        return errorTip({code: 1, message: e});
                    }

                    var err = res.code && res.code > 0 ? true : false;
                    err     = res.err && res.err > 0 ? true : false;

                    if (this.status == 200 && !err) {

                        $('#createForm').hide();
                        self.refreshModel();
                        return successTip({code: 0, message: '注册成功'}, 1000 * 2, true);
                        //return self.clearInput(['title', 'description', 'image', 'start', 'end']);
                    }
                    return errorTip(this.responseXML || this.responseText);
                };
                xhr.send(formData);
            },
            clearInput       : function (ids) {
                if (!ids) return false;
                var clear = function (id) {
                    return $('#' + id).val("")
                };
                for (var i = 0, len = ids.length; i < len; i++) {
                    clear(ids[i]);
                }
            },
            redirect         : function (url) {
                if (!url) return false;
                return window.location.href = url;
            },
            onPage           : function (event, page) {
                event.preventDefault();

                if (page === 'prev') {
                    --this.page;
                    this.page = this.page < 0 ? 0 : this.page;
                } else if (page === 'next') {
                    ++this.page;
                    this.page = this.page > this.pc - 1 ? this.pc - 1 : this.page;
                } else {
                    this.page = page;
                }
                this.refreshModel(this.page);
            }
        },
        computed: {
            pageList      : function () {
                this.pc = Math.ceil(this.total / this.pageSize);
                if (isNaN(this.pc)) return [];
                return new Array(this.pc);
            },
            showPagination: function () {
                this.pc = Math.ceil(this.total / this.pageSize);
                return !isNaN(this.pc) && this.pc > 1;
            }
        },
        directives: {
            showinputdate: {
                update: function (value) {
                    var date = moment(value).format('YYYY-MM-DD HH:mm:ss');
                    this.el.value = date;
                    return;
                }
            },
            showtddate:{
                update: function (value) {
                    var date = moment(value).format('YYYY-MM-DD HH:mm:ss');
                    this.el.innerHTML = date;
                    return;
                }
            },
            checkpermission    :{
                update: function(newValue, oldValue){
                    if(!newValue && !oldValue) return false;
                    var level = newValue || oldValue;
                    if(level != 1){
                        this.el.disabled = true;
                    }
                }
            }
        }
    });


    //if(window.options.action === 'none') return;
    //return profile.vue.refreshModel();
});