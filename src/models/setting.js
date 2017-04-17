/**
 * Proxy设置表
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午4:35
 **/
import mongoose from './connect';
const Schema = mongoose.Schema;
const SettingSchema = new Schema({
    port: {type: Number, required: true},
    anyproxy_port: {type: Number, required: true},
    ws_port: {type: Number, required: true},
    url: {type: String, required: true},
    forceProxyHttps: {type: Boolean, required: true},
    throttle: {type: Number}
});
const Setting = mongoose.model('Setting', SettingSchema);

/**
 * 获取AnyProxy
 * @returns {Promise}
 */
const getProxy = () => {
    return new Promise((resolve, reject) => {
        Setting.findOne().then((result) => {
            resolve({
                "result": result,
                "code": 200,
                "msg": "success"
            });
        });
    });
};

/**
 * 设置AnyProxy
 * @param list
 * @returns {Promise}
 */
const setProxy = (list) => {
    return new Promise((resolve, reject) => {
        const id = list._id;
        delete list._id;
        Setting.updateOne({_id: id}, list).then((result) => {

            //拦截url改变
            global.reqMaps.urlChange(list.url);
            global.resMaps.urlChange(list.url);

            resolve({
                "result": result,
                "code": result.ok === 1 ? 200 : 500,
                "msg": result.ok === 1 ? "保存成功" : "保存失败"
            });
        });
    });
};

export default {
    getProxy, setProxy
}