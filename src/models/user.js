/**
 * 用户表
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午2:55
 **/
import mongoose from './connect';

const Schema = mongoose.Schema;
const UsersSchema = new Schema({
    password: {type: String, required: true},
    user: {type: String, required: true},
});

const Users = mongoose.model('Users', UsersSchema);

/**
 * 简单的登录
 * @param user
 * @returns {Promise}
 */
const getUser = (user) => {
    return new Promise((resolve, reject) => {
        Users.findOne({'user':user}).then((result) => {
            resolve(result);
        });
    });
};

export default {
    getUser
}