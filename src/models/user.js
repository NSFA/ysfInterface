/**
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
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