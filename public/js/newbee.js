/**
 * Created by Daniels on 10/19/15.
 */

var Manager = {
    findAll: 'GET /aa/lawyer?start={start}&rows={rows}',
    findOne: 'GET /aa/lawyer/{id}'
};

var ManagerModel= new Model(Manager);

var dataModel = {
    'manager':{model: ManagerModel,view: '#managerDiv'}
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
            selected : 0
        },
        methods : {
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