/**
 * API列表
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/24
 * Time: 下午1:49
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const ApiListSchema = new Schema({
    name: {type: String, required: true},
    status: {type: Boolean, required: true},
    json: {type: JSON, required: true},
    date: {type: Date, default: Date.now}
});
const ApiList = mongoose.model('ApiList', ApiListSchema);

/**
 * 获取API列表
 * @returns {Promise}
 */
const getApiList = () => {
    return new Promise((resolve, reject) => {
        ApiList.find().sort({"name":-1}).then((result) => {
            resolve(result);
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
        if (!api.name || !api.json) resolve({
            code: 8001,
            msg: "请完整输入API信息"
        });
        if (api.id === -1) {
            ApiList.find({name: api.name}).then((res) => {
                if (res.length) {
                    resolve({
                        code: 8000,
                        msg: "已存在相应API"
                    })
                } else {
                    ApiList.create(api).then((result) => {
                        resolve({
                            result: result,
                            code: 200,
                            msg:"创建API成功"
                        });
                    });
                }
            });
        } else {
            ApiList.updateOne({_id: api.id}, api).then((result) => {
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
    addApi, getApiList, delApi, getApi
}