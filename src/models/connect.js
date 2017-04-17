/**
 * 连接Mongodb
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午2:18
 **/

import mongoose from 'mongoose';
import logUtil from'../../proxy/lib/log'

mongoose.Promise = global.Promise;

let db = mongoose.connection;

db.once('open', () => {
    logUtil.printLog("Mongodb database connected");
});

mongoose.connect('mongodb://59.111.99.122:27017/ysf', function (err) {
    if (err) {
        logUtil.printLog(`connect to ysf error: ${err.message}`,logUtil.T_ERR);
        process.exit(1);
    }
});


export default mongoose;
