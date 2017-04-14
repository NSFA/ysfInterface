/**
 * Created by qingze
 * User: qingze
 * Date: 2017/4/14
 * Time: 上午9:26
 **/


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

export default {
    latestLog
}