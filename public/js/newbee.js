/**
 * Created by Daniels on 10/19/15.
 */

var Manager = {
    findAll: 'GET /aa/lawyer?start={start}&rows={rows}',
    findOne: 'GET /aa/lawyer/{id}',
    update: 'PUT /aa/lawyer/{id}'
};

var Operator = {
    findAll: 'GET /aa/operators?start={start}&rows={rows}',
    findOne: 'GET /aa/operator/{id}',
    create: 'POST /aa/operator',
    destroy: 'DELETE /aa/operator/{id}',
    update: 'PUT /aa/operator/{id}'
};

var Case = {
    findAll: 'GET /aa/cases?start={start}&rows={rows}',
    findOne: 'GET /aa/case/{id}',
    update: 'PUT /aa/case/{id}'
};

var ManagerModel = new Model(Manager);
var OperatorModel = new Model(Operator);
var CaseModel = new Model(Case);

var dataModel = {
    'manager':  { model: ManagerModel,  view: '#managerDiv' },
    'operator': { model: OperatorModel, view: '#OperatorDiv' },
    'case':     { model: CaseModel, view: '#caseDiv' }
};


$(function(){
    validator.authId = function(id){
        if(!id) return false;
        var re = new RegExp(/^[1-9]\d{16}[\d|x|X]$/g);
        return re.test(id);
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
            selected : 0,
            display  : 0
        },
        methods : {
            onLawyerSuccess: function(id){
                var lawyerId = id;
                if(!lawyerId) return errorTip({code: 1, message: 'LawyerId不能为空'}, 1000 * 3);
                var self = this;
                var action = 'ok';

                var nc = new this.model({id: lawyerId, action: action});
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('更新律师信息成功', 1000 * 3, true, '/ap/manager');
                });
            },
            onLawyerRejected: function(id){
                var lawyerId = id;
                if(!lawyerId) return errorTip({code: 1, message: 'LawyerId不能为空'}, 1000 * 3);
                var self = this;
                var action = 'reject';

                var reason = $('#rejectedInfo').val();
                if(!reason) return errorTip({code: 1, message: '拒绝理由不能为空'}, 1000 * 3);

                var nc = new this.model({id: lawyerId, reason: reason, action: action});
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('更新律师信息成功', 1000 * 3, true, '/ap/manager');
                });
            },
            onCaseSuccess: function(id){

                var caseId = id;
                if(!caseId) return errorTip({code: 1, message: 'CaseId不能为空'}, 1000 * 3);
                var self = this;
                var action = 'online';
                var rank = $('#rank').val();

                var nc = new this.model({id: caseId, action: action, rank: rank});
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    successTip('更新案例成功', 1000 * 3, true);
                });
            },
            onCaseRejected: function(id){
                var caseId = id;
                if(!caseId) return errorTip({code: 1, message: 'CaseId不能为空'}, 1000 * 3);

                var reason = $('#rejectedInfo'+id).val();
                if(!reason) return errorTip({code: 1, message: '拒绝理由不能为空'}, 1000 * 3);

                var self = this;
                var action = 'reject';

                var nc = new this.model({id: caseId, reason: reason, action: action});
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('更新案例成功', 1000 * 3, true);
                });
            },
            onUpdateOperator: function(id){
                var data = {};
                data.id = id;
                data.username = $('#username').val();
                data.email = $('#email').val();
                data.level = $('#levels').val();
                if($('#password').val()) data.password = $('#password').val();
                if($('#cpd').val()) data.cpd = $('#cpd').val();

                var nc = new this.model(data);
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('更新用户成功', 1000 * 3, true);
                });

            },
            onDelOperator: function(id){
                if(!id) return false;

                var self = this;
                var nc = new this.model({id: id});
                nc.destroy(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('删除用户成功', 1000 * 3, true);
                });

            },
            onCreateOperator: function(){
                var data = {};
                data.username = $('#username').val();
                data.email = $('#email').val();
                data.level = $('#levels').val();
                data.password = $('#password').val();
                data.cpassword = $('#cpd').val();

                var err = {code: 1, message: ''};
                if(data.password != data.cpassword){
                    err.message = '新密码和确认密码不匹配';
                    return errorTip(err, 1000 * 3);
                }
                if(!data.username) {
                    err.message = '用户名不能为空';
                    return errorTip(err, 1000 * 3);
                }
                if(!data.email) {
                    err.message = '邮件不能为空';
                    return errorTip(err , 1000 * 3);
                }
                if(!validator.isEmail(data.email)) {
                    err.message = '邮箱格式错误';
                    return errorTip(err, 1000 * 3);
                }

                var self = this;

                var nc = new this.model(data);
                nc.save(function(result){
                    if(result.rtn != 0){
                        return errorTip(result, 1000 * 5);
                    }
                    return successTip('创建用户成功', 1000 * 3, true);
                });
            },

            findOne: function(){

                var id = options.id;
                if(!id) return false;
                var self = this;

                this.model.findOne({id: id}, function(result){
                    self.contents = result.data;
                    console.log(JSON.stringify(result));
                },function (xhr) {
                    errorTip(xhr.responseText);
                });


            },
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

                this.model.findAll(params, function (result) {
                    var cm   = [];
                    var list = result.data;
                    for (var i = 0, length = list.length; i < length; i++) {
                        cm.push(list[i]);
                    }
                    if(list.length <= 0) self.display = true;
                    self.contents = cm;
                    self.total    = result.total || 0;
                    self.page     = page;
                }, function (xhr) {
                    errorTip(xhr.responseText);
                });
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


    if(window.options.action === 'none') return;
    if(window.options.action === 'findOne') return profile.vue.findOne();
    return profile.vue.refreshModel();
});