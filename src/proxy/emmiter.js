/**
 * Created by qingze
 * User: hzqingze
 * Date: 2017/3/28
 * Time: 下午10:23
 **/
const EventEmitter = require('events');

class ApiEmitter extends EventEmitter {
}
const apiEmitter = new ApiEmitter();

export default apiEmitter;