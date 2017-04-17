/**
 * API列表
 * Created by qingze
 * Date: 2017/3/24
 * Time: 下午1:49
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const ApiListSchema = new Schema({
    name: {type: String, required: true},
    status: {type: Boolean, required: true},
    jsonArr: {type: Object, required: true},
    statusCode: {type: Number, required: true},
    template: {type: String, required: true},
    templateOptions: {type: Array, required: true},
    date: {type: Date, default: Date.now},
    update: {type: Date}
});

const ApiList = mongoose.model('ApiList', ApiListSchema);

/**
 * 获取API列表
 * @returns {Promise}
 */
const getApiList = () => {
    return new Promise((resolve, reject) => {
        ApiList.find().sort({"name": -1}).then((result) => {
            resolve({
                "result": result,
                "code": 200,
                "msg": "获取Api列表成功"
            });
        });
    });
};

/**
 * 删除API信息
 * @param api
 * @returns {Promise}
 */
const delApi = (api) => {
    return new Promise((resolve, reject) => {
        ApiList.remove({_id: api.id}).then((result) => {

            //删除api
            global.resMaps.itemDel(api.id);

            resolve({
                code: 200,
                msg: '删除Api成功',
                result: result
            });
        });
    });
};

/**
 * 获取AIP信息
 * @param api
 * @returns {Promise}
 */
const getApi = (api) => {
    return new Promise((resolve, reject) => {
        ApiList.findOne({_id: api.id}).then((result) => {
            resolve({
                code: 200,
                msg: '获取API成功',
                result: result
            });
        });
    });
};

/**
 * 添加或编辑API项
 * @param api
 * @returns {Promise}
 */
const addApi = (api) => {
    return new Promise((resolve, reject) => {
        if (!api.name || !api.jsonArr) resolve({
            code: 400,
            result: "",
            msg: "请完整输入API信息"
        });
        //新建Api
        if (api.id === -1) {
            ApiList.find({name: api.name}).then((res) => {
                if (res.length) {
                    resolve({
                        code: 400,
                        result: "",
                        msg: "已存在相应API"
                    })
                } else {
                    api.update = new Date();
                    ApiList.create(api).then((result) => {

                        //添加api
                        global.resMaps.itemAdd(result);

                        resolve({
                            result: result,
                            code: 200,
                            msg: "创建API成功"
                        });
                    });
                }
            });
        } else {
            //编辑Api
            api.update = new Date();
            ApiList.updateOne({_id: api.id}, api).then((result) => {

                //编辑api
                global.resMaps.itemEdit(api.id,api);

                resolve({
                    result: result,
                    code: 200,
                    msg: "编辑API成功"
                });
            })
        }
    });
};
/**
 * 更新状态
 * @param req
 * @returns {Promise}
 */
const updateStatus = (req) => {
    return new Promise((resolve, reject) => {
        ApiList.findByIdAndUpdate(req.id, {$set: {status: req.status}}, function (err, result) {
            if (err) {
                reject({
                    code: 500,
                    message: "编辑失败",
                    result: err
                })
            }

            //api状态更新
            global.resMaps.itemStatusChange(req.status,req.id);

            resolve({
                result: "",
                code: 200,
                msg: "编辑API成功"
            })
        });
    });
};

export default {
    addApi, getApiList, delApi, getApi, updateStatus
}