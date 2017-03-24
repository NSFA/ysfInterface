/**
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午4:35
 **/
import mongoose from './connect';
const Schema = mongoose.Schema;
const SettingSchema = new Schema({
    port: {type: Number, required: true},
    anyproxy_port: {type: Number, required: true},
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
            resolve(result);
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
        Setting.updateOne(list).then((result) => {
            resolve(result);
        });
    });
};

export default {
    getProxy, setProxy
}