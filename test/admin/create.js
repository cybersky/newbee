/**
 * Created by Daniels on 12/24/15.
 */
var assert = require('assert');
var async = require('async');
var request = require('request');
var config = require('../../profile/config');
var fs  = require('fs');


request = request.defaults({jar:true});
var host = 'http://localhost:8080';

var identityFile = __dirname + '/avatar.jpg';
var lawyerIdFile = __dirname + '/id.jpg';
var emailPostfix = '@newbee.com';
var password = cpassword = '123.com';

var names = [
    {
        name: 'Alex', id: '220723199004119215', lawyerId: '11101200211721756',
        phoneNumber: '13681051569', lawyerLocation:'山东青岛', lawServiceArea:'公司法务纠纷'
    },
    {
        name: 'Daniels', id: '361022198702218395', lawyerId: '11101201211721756',
        phoneNumber: '15117979508', lawyerLocation:'北京', lawServiceArea:'公司法务纠纷'
    },
    {
        name: 'Bob', id: '510921198210288151', lawyerId: '15101211211720756',
        phoneNumber: '13693597508', lawyerLocation:'上海', lawServiceArea:'债权债务纠纷'
    },
    {
        name: 'Adam', id: '520526198908195194', lawyerId: '11101211211721757',
        phoneNumber: '13693600276', lawyerLocation:'山西', lawServiceArea:'合同纠纷'
    },
    {
        name: 'Lambert', id: '610801198803037457', lawyerId: '14101211200621756',
        phoneNumber: '15010190185', lawyerLocation:'湖南', lawServiceArea:'房屋租赁,买卖,拆迁纠纷'
    },
    {
        name: 'Kelly', id: '370681199203238293', lawyerId: '11101211211720056',
        phoneNumber: '15010190785', lawyerLocation:'American', lawServiceArea:'劳动工伤纠纷'
    },
    {
        name: 'James', id: '130302197910095310', lawyerId: '12101211211722016',
        phoneNumber: '15010191290', lawyerLocation:'French', lawServiceArea:'离婚纠纷'
    },
    {
        name: 'Peter', id: '140181197810252792', lawyerId: '11101211211720836',
        phoneNumber: '13717659396', lawyerLocation:'天津', lawServiceArea:'交通事故纠纷'
    },
    {
        name: 'Tom', id: '542625198604046493', lawyerId: '11101211211721756',
        phoneNumber: '15910702776', lawyerLocation:'福建', lawServiceArea:'刑事辩护'
    }
];
/*
var getName = function(){
    var nameIndex = 0;
    var nameLength = names.length;
    return function (){
        if(nameIndex >= nameLength) nameIndex = 0;
        return names[nameIndex < nameLength ? nameIndex++ : 0];
    };
};*/


describe('Ready to run lawyer sign up system', function() {

    beforeEach(function() {
        console.log('\nTEST CREATE API ...\n');
    });

    afterEach(function() {
        console.log('\nCREATE API FINISHED ...\n');
    });

    describe('Post data for create lawyer', function(){
        it('Create lawyer', function(done){
            async.each(names, function(lawyerInfo, callback){
                var lawyer = {
                    username: lawyerInfo.name,
                    email: lawyerInfo.name + emailPostfix,
                    password: password,
                    phoneNumber: lawyerInfo.phoneNumber,
                    identityNumber: lawyerInfo.id,
                    lawyerId: lawyerInfo.lawyerId,
                    lawyerLocation: lawyerInfo.lawyerLocation,
                    lawServiceArea: lawyerInfo.lawServiceArea,
                    identityImage: fs.createReadStream(identityFile),
                    lawyerIdImage: fs.createReadStream(lawyerIdFile)
                };

                var option = {
                    url:host + '/ua/signup',
                    json:true,
                    formData: lawyer,
                    method:'post'
                };
                request(option, function(err, resp, body){
                    if(err) throw new Error(err);
                    if(typeof body == 'string'){
                        try{ body = JSON.parse(body); } catch(err){ console.error('error response:', body); }
                    }
                    assert.equal(body.rtn , 0);
                    console.log('Lawyer create ok, id:', body.data._id);

                    callback(null, body);
                });

            }, done);

        });
    });
});