/**
 * API列表
 * Created by qingze
 * Date: 2017/3/24
 * Time: 下午1:49
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const ApiReqListSchema = new Schema({
    name: {type: String, required: true},
    status: {type: Boolean, required: true},
    reqArr: {type: Object, required: true},
    template: {type: String, required: true},
    templateOptions: {type: Array, required: true},
    type: {type: Number, required: true},
    date: {type: Date, default: Date.now},
    update: {type: Date}
});
const ApiReqList = mongoose.model('ApiReqList', ApiReqListSchema);

/**
 * 获取API列表
 * @returns {Promise}
 */
const getReqApiList = () => {
    return new Promise((resolve, reject) => {
        ApiReqList.find().sort({"name": -1}).then((result) => {
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
const delReqApi = (api) => {
    return new Promise((resolve, reject) => {
        ApiReqList.remove({_id: api.id}).then((result) => {

            //删除api
            global.reqMaps.itemDel(api.id);

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
const getReqApi = (api) => {
    return new Promise((resolve, reject) => {
        ApiReqList.findOne({_id: api.id}).then((result) => {
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
const addReqApi = (api) => {
    return new Promise((resolve, reject) => {
        if (!api.name || !api.reqArr) resolve({
            code: 400,
            msg: "请完整输入API信息",
            result: ""
        });
        //添加
        if (api.id === -1) {
            ApiReqList.find({name: api.name}).then((res) => {
                if (res.length) {
                    resolve({
                        code: 400,
                        msg: "已存在相应API",
                        result: ""
                    })
                } else {
                    api.update = new Date();
                    ApiReqList.create(api).then((result) => {

                        //添加api
                        global.reqMaps.itemAdd(result);

                        resolve({
                            result: result,
                            code: 200,
                            msg: "创建API成功"
                        });
                    });
                }
            });
        } else {
            //编辑
            api.update = new Date();
            ApiReqList.updateOne({_id: api.id}, api).then((result) => {

                //编辑api
                global.reqMaps.itemEdit(api.id,api);

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
        ApiReqList.findByIdAndUpdate(req.id, {$set: {status: req.status}}, function (err, result) {
            if (err) {
                reject({
                    code: 500,
                    message: "编辑失败",
                    result: err
                })
            }

            //api状态改变
            global.reqMaps.itemStatusChange(req.status,req.id);

            resolve({
                result: "",
                code: 200,
                msg: "编辑API成功"
            })
        });
    });
};

export default {
    addReqApi, getReqApiList, delReqApi, getReqApi,updateStatus
}