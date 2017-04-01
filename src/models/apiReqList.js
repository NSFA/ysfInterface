/**
 * API列表
 * Created by qingze
 * User: hzqingze
 * Date: 2017/3/24
 * Time: 下午1:49
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const ApiReqListSchema = new Schema({
    name: {type: String, required: true},
    status: {type: Boolean, required: true},
    reqData: {},
    type:{type:Number,required:true},
    date: {type: Date, default: Date.now}
});
const ApiReqList = mongoose.model('ApiReqList', ApiReqListSchema);

/**
 * 获取API列表
 * @returns {Promise}
 */
const getReqApiList = () => {
    return new Promise((resolve, reject) => {
        ApiReqList.find().sort({"name": -1}).then((result) => {
            resolve(result);
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
        if (!api.name) resolve({
            code: 8001,
            msg: "请完整输入API信息"
        });
        if (api.id === -1) {
            ApiReqList.find({name: api.name}).then((res) => {
                if (res.length) {
                    resolve({
                        code: 8000,
                        msg: "已存在相应API"
                    })
                } else {
                    ApiReqList.create(api).then((result) => {
                        resolve({
                            result: result,
                            code: 200,
                            msg: "创建API成功"
                        });
                    });
                }
            });
        } else {
            ApiReqList.updateOne({_id: api.id}, api).then((result) => {
                resolve({
                    result: result,
                    code: 200,
                    msg: "编辑API成功"
                });
            })
        }
    });
};


export default {
    addReqApi, getReqApiList, delReqApi, getReqApi
}