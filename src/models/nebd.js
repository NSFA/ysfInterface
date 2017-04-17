/**
 * Created by qingze
 * Date: 2017/4/14
 * Time: 上午9:26
 **/

/**
 * nedb获取最近10000条数据
 * @returns {Promise}
 */
const latestLog = () => {
    return new Promise((resolve, reject) => {
        global.recorder.db.find()
            .sort({_id: 1})
            .limit(10000)
            .exec((err, result) => {
                if (err) reject(err.toString());
                resolve({
                    "result": result,
                    "code": 200,
                    "msg": "success"
                });
            })
    });

};
/**
 * 获取数据返回信息
 * @type {(p1?:*)}
 */
const getLogBody = ((id) => {
    return new Promise((resolve, reject) => {
        global.recorder.getDecodedBody(id, (err, result) => {
            resolve(result);
        });
    });
});

export default {
    latestLog,getLogBody
}