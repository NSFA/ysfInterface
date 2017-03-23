/**
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午2:18
 **/

import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

let db = mongoose.connection;
db.once('open', () => {
    console.log("database connected")
});

mongoose.connect('mongodb://127.0.0.1:27017/ysf', function (err) {
    if (err) {
        console.error('connect to %s error: ', 'ysf', err.message);
        process.exit(1);
    }
});


export default mongoose;
