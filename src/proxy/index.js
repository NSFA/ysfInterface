/**
 * AnyProxy
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午6:28
 **/
import setting from '../models/setting'
import apiList from '../models/apiList'
import apiReqList from '../models/apiReqList'
import _ from 'lodash';
import path from 'path';
import emitter from './emitter';
import AnyProxy from '../../proxy/proxy'
import {ThrottleGroup} from 'stream-throttle'
import logUtil from'../../proxy/lib/log'

const getSetInfo = async () => {

    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    const apiReqSet = await apiReqList.getReqApiList();
    let proxyUrl = proxySet.result.url; // 区分二级域名

    // --------------------------------------  事件监听  -------------------------------------- //
    /**
     * 响应Api表
     */
    let apiMap = _.map(apiSet.result, (item) => {
        return {
            "url": path.join(proxySet.result.url, item.name),
            "jsonArr": item.jsonArr,
            "status": item.status,
            "statusCode": item.statusCode,
            "id": item._id,
            "name": item.name,
            "template": item.template
        }
    });
    /**
     * 请求Api表
     */
    let apiReqMap = _.map(apiReqSet.result, (item) => {
        return {
            "url": path.join(proxySet.result.url, item.name),
            "reqArr": item.reqArr,
            "template": item.template,
            "status": item.status,
            "id": item._id,
            "type": item.type,
            "name": item.name
        }
    });
    /**
     * 响应Api添加监听
     */
    emitter.on('apilistadd', function (result) {
        apiMap.push({
            "url": path.join(proxySet.result.url, result.name),
            "jsonArr": result.jsonArr,
            "status": result.status,
            "statusCode": result.statusCode,
            "id": result._id,
            "name": result.name,
            "template": result.template,
        });
    });
    /**
     * 响应Api编辑监听
     */
    emitter.on('apilistedit', function (result) {
        apiMap = _.forEach(apiMap, function (item) {
            if (item.id == result.id) {
                _.extend(item, {
                    "url": path.join(proxySet.result.url, result.name),
                    "jsonArr": result.jsonArr,
                    "status": result.status,
                    "statusCode": result.statusCode,
                    "template": result.template,
                    "name": result.name
                });
                return false;
            }
        });
    });
    /**
     * 响应Api删除监听
     */
    emitter.on('apilistdel', function (id) {
        apiMap = _.filter(apiMap, function (item) {
            return item.id != id
        });
    });
    /**
     * 请求Api添加监听
     */
    emitter.on('apireqlistadd', function (result) {
        apiReqMap.push({
            "url": path.join(proxySet.result.url, result.name),
            "reqArr": result.reqArr,
            "template": result.template,
            "status": result.status,
            "name": result.name,
            "type": result.type,
            "id": result._id
        });
    });
    /**
     * 请求Api编辑监听
     */
    emitter.on('apireqlistedit', function (result) {
        apiReqMap = _.forEach(apiReqMap, function (item) {
            if (item.id == result.id) {
                _.extend(item, {
                    "url": path.join(proxySet.result.url, result.name),
                    "reqArr": result.reqArr,
                    "template": result.template,
                    "status": result.status,
                    "name": result.name,
                    "type": result.type
                });
                return false;
            }
        });
    });
    /**
     * 请求Api删除监听
     */
    emitter.on('apireqlistdel', function (id) {
        apiReqMap = _.filter(apiReqMap, function (item) {
            return item.id != id
        });
    });
    /**
     * 拦截url改变
     */
    emitter.on('urlchange', function (url) {

        proxyUrl = url;

        apiMap = _.forEach(apiMap, (item) => {
            item.url = path.join(url, item.name)
        });

        apiReqMap = _.forEach(apiReqMap, (item) => {
            item.url = path.join(url, item.name)
        });
    });
    /**
     * apistatus
     */
    emitter.on('apistatus', function (req) {
        if (req.list === "req") {
            apiReqMap = _.forEach(apiReqMap, (item) => {
                if (item.id == req.id) {
                    item.status = req.status;
                    return !1;
                }
            });
        } else {
            apiMap = _.forEach(apiMap, (item) => {
                if (item.id == req.id) {
                    item.status = req.status;
                    return !1;
                }
            });
        }
    });

    // --------------------------------------  rule  -------------------------------------- //
    const rule = {
        async beforeSendRequest(requestDetail) {
            const hostname = requestDetail.requestOptions.hostname;
            const path = requestDetail.requestOptions.path.split('?')[0];
            let reqData, reqType;

            _.forEach(apiReqMap, function (item) {
                if (hostname.indexOf(proxyUrl) > -1 && item.status && path.indexOf(item.name) > -1) {
                    reqData = item.reqArr[item.template].reqData;
                    reqType = item.reqArr[item.template].type;
                    return false;
                }
            });

            /**
             * 合并请求头
             * @param urlParams
             * @param reqData
             * @returns {string}
             */
            const mergeRequestBody = function (urlParams, reqData) {
                if (!urlParams) {
                    return '';
                }

                let params = JSON.parse('{"' + decodeURI(urlParams).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                let ret = {};
                for (let i in reqData) {
                    if (reqData.hasOwnProperty(i)) {
                        ret[reqData[i].key] = reqData[i].value;
                    }
                }

                let merge = Object.assign({}, params, ret);

                return Object.keys(merge).map(function (k) {
                    return encodeURI(k) + '=' + encodeURI(merge[k]);
                }).join('&')

            };

            if (reqData) {
                switch (reqType) {
                    // application/json
                    case 1:
                        try {
                            let ret = Object.assign({}, eval('(' + requestDetail.requestData.toString() + ')'), reqData);
                            return {
                                requestData: JSON.stringify(ret)
                            }
                        } catch (err) {
                            return {
                                requestData: JSON.stringify(reqData)
                            };
                        }
                        break;
                    // application/x-www-form-urlencoded
                    case 2:
                        let reqForm = "";
                        if (requestDetail.requestOptions.method === 'GET') {
                            const newOption = Object.assign({}, requestDetail.requestOptions);
                            reqForm = mergeRequestBody(requestDetail.requestOptions.path.split('?')[1], reqData);
                            newOption.path = `${requestDetail.requestOptions.path.split('?')[0]}?${reqForm}`;
                            return {
                                requestOptions: newOption
                            }
                        } else {
                            reqForm = mergeRequestBody(requestDetail.requestData, reqData);
                            return {
                                requestData: reqForm
                            }
                        }
                        break;
                    // other
                    case 3:
                        return {
                            requestData: reqForm
                        };
                        break;
                    default:
                        break;
                }
            } else {
                return null
            }
        },
        async beforeSendResponse(requestDetail, responseDetail) {
            let newRes = responseDetail.response;

            const hostname = requestDetail.requestOptions.hostname;
            const path = requestDetail.requestOptions.path.split('?')[0];

            _.forEach(apiMap, function (item) {
                if (hostname.indexOf(proxyUrl) > -1 && item.status && path.indexOf(item.name) > -1) {
                    newRes.header['X-Proxy-By'] = 'YSF-MOCK';
                    newRes.body = JSON.stringify(item.jsonArr[item.template]);
                    newRes.statusCode = item.statusCode || 200;
                    return false;
                }
            });
            return {
                response: newRes
            }
        },
    };
    return {
        port: proxySet.result.port,
        rule: rule,
        wsPort: proxySet.result.ws_port,
        throttle: proxySet.result.throttle || '',
        forceProxyHttps: proxySet.result.forceProxyHttps,
        silent: false
    };
};

// --------------------------------------  开启代理服务  -------------------------------------- //
async function openAnyProxy() {
    const options = await getSetInfo();
    const proxySvr = new AnyProxy.ProxyServer(options);

    proxySvr.on('ready', () => {
        if (options.throttle) {
            const rate = parseInt(options.throttle, 10);
            if (rate < 1) {
                throw new Error('Invalid throttle rate value, should be positive integer');
            }
            global._throttle = new ThrottleGroup({rate: 1024 * rate}); // rate - byte/sec
            logUtil.printLog(`限速 ${rate} kb/s`)
        }
    });

    proxySvr.start();
}

export default {
    openAnyProxy
}
