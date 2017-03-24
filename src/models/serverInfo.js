/**
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午5:11
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const ServerInfoSchema = new Schema({
    status: {type: Boolean, required: true},
});
const ServerInfo = mongoose.model('ServerInfo', ServerInfoSchema);

/**
 * 获取服务器信息
 * @returns {Promise}
 */
const getInfo = () => {
    return new Promise((resolve, reject) => {
        ServerInfo.findOne().then((result) => {
            resolve(result);
        });
    });
};

/**
 * 设置服务器信息
 * @param status
 * @returns {Promise}
 */
const setInfo = (status) => {
    return new Promise((resolve, reject) => {
        ServerInfo.updateOne(status).then((result) => {
            resolve(result);
        });
    });
};


export default {
    getInfo,setInfo
}