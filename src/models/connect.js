/**
 * 连接Mongodb
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午2:18
 **/

import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

let db = mongoose.connection;
db.once('open', () => {
    console.log("database connected")
});

mongoose.connect('mongodb://59.111.99.122:27017/ysf', function (err) {
    if (err) {
        console.error('connect to %s error: ', 'ysf', err.message);
        process.exit(1);
    }
});


export default mongoose;
