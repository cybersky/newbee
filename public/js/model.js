/**
 * Created by Daniels on 10/21/15.
 */
/*
var channelDef = {
    findAll: 'GET /admin/api/channels?start={start}&rows={rows}',
    findOne: 'GET /admin/api/channels/{channelId}',
    create: 'POST /admin/api/channels',
    update: 'PUT /admin/api/channels/{id}',
    destroy: 'DELETE /admin/api/channels/{id}'
};
*/

var Model = function(defs){

    if(!defs) return null;

    var createStatic = function(defValue){
        return function(dataValue, callback, errorcb){

            var valArray = defValue.split(/\s+/);
            var method = valArray[0];
            var url = valArray[1];

            for(var k in dataValue){
                var key = ['{', k,'}'].join('');
                url = url.replace(key, dataValue[k]);
            }

            var settings = {
                type:method.toUpperCase(),
                success:function(data, textStatus, jqXHR){
                    //if(data && data.data && _.isArray(data.data)) data = data.data;
                    callback(data, textStatus, jqXHR);
                },
                error:function(jqXHR, textStatus, errorThrown){
                    errorcb(jqXHR, textStatus, errorThrown);
                }};

            if(settings.type === 'PUT' || settings.type === 'POST' ){
                settings.data = dataValue;
            }
            $.ajax(url, settings);
        }
    };

    var ModelConstructor = function(dataValue){
        this.dataValue  = dataValue;
        this.definition = defs;
    };

    for(var def in defs){
        //create static methods
        ModelConstructor[def] = createStatic(defs[def]);
    }

    ModelConstructor.prototype.save = function(callback, ecb){
        if(this.dataValue.id){
            ModelConstructor.update(this.dataValue, callback, ecb);
        }else{
            ModelConstructor.create(this.dataValue, callback, ecb);
        }
    };

    ModelConstructor.prototype.top = function(callback,ecb){
        if(this.dataValue.id){
            ModelConstructor.top(this.dataValue,callback,ecb);
        }
    };

    ModelConstructor.prototype.sort = function(callback,ecb){
        if(this.dataValue.id){
            ModelConstructor.sort(this.dataValue,callback,ecb);
        }
    };

    ModelConstructor.prototype.publish = function(callback,ecb){
        if(this.dataValue.id){
            ModelConstructor.publish(this.dataValue,callback,ecb);
        }
    };

    ModelConstructor.prototype.destroy = function(callback, ecb){
        if(this.dataValue.id){
            ModelConstructor.destroy(this.dataValue, callback, ecb);
        }else{
            ecb('instance destroy method must has id property');
        }
    };

    return ModelConstructor;
};