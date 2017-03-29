/**
 * AnyProxy
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午6:28
 **/
import setting from '../models/setting'
import apiList from '../models/apiList'
import apiReqList from '../models/apiReqList'
import _ from 'lodash';
import path from 'path';
import apiEmiiter from './emmiter';
import AnyProxy from 'anyproxy'

const getSetInfo = async () => {
    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    const apiReqSet = await apiReqList.getReqApiList();
    const urlReg = /(\w+):\/\/(([^\:|\/]+)(\:\d*)?(.*\/)([^#|\?|\n]+))?(#.*)?(\?.*)?/i;
    // --------------------------------------  事件监听  -------------------------------------- //
    /**
     * 响应Api表
     */
    let apiMap = _.map(apiSet, (item) => {
        return {
            "url": path.join(proxySet.url, item.name),
            "json": item.json,
            "status": item.status,
            "statusCode": item.statusCode,
            "id": item._id,
            "name": item.name
        }
    });
    /**
     * 请求Api表
     */
    let apiReqMap = _.map(apiReqSet, (item) => {
        return {
            "url": path.join(proxySet.url, item.name),
            "reqData": item.reqData,
            "status": item.status,
            "id": item._id,
            "type": item.type,
            "name": item.name
        }
    });
    /**
     * 响应Api添加监听
     */
    apiEmiiter.on('apilistadd', function (result) {
        apiMap.push({
            "url": path.join(proxySet.url, result.name),
            "json": result.json,
            "status": result.status,
            "statusCode": result.statusCode,
            "id": result._id,
            "name": result.name
        });
    });
    /**
     * 响应Api编辑监听
     */
    apiEmiiter.on('apilistedit', function (result) {
        apiMap = _.forEach(apiMap, function (item) {
            if (item.id == result.id) {
                _.extend(item, {
                    "url": path.join(proxySet.url, result.name),
                    "json": result.json,
                    "status": result.status,
                    "statusCode": result.statusCode,
                    "name": result.name
                });
                return false;
            }
        });
    });
    /**
     * 响应Api删除监听
     */
    apiEmiiter.on('apilistdel', function (id) {
        apiMap = _.filter(apiMap, function (item) {
            return item.id != id
        });
    });
    /**
     * 请求Api添加监听
     */
    apiEmiiter.on('apireqlistadd', function (result) {
        apiReqMap.push({
            "url": path.join(proxySet.url, result.name),
            "reqData": result.reqData,
            "status": result.status,
            "name": result.name,
            "type": result.type,
            "id": result._id
        });
    });
    /**
     * 请求Api编辑监听
     */
    apiEmiiter.on('apireqlistedit', function (result) {
        apiReqMap = _.forEach(apiReqMap, function (item) {
            if (item.id == result.id) {
                _.extend(item, {
                    "url": path.join(proxySet.url, result.name),
                    "reqData": result.reqData,
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
    apiEmiiter.on('apireqlistdel', function (id) {
        apiReqMap = _.filter(apiReqMap, function (item) {
            return item.id != id
        });
    });
    /**
     * 拦截url改变
     */
    apiEmiiter.on('urlchange', function (url) {
        apiMap = _.forEach(apiMap, (item) => {
            item.url = path.join(url, item.name)
        });
    });
    // --------------------------------------  rule  -------------------------------------- //
    const rule = {
        async beforeSendRequest(requestDetail) {
            const reqUrl = urlReg.exec(requestDetail.url)[2];
            let reqData, reqType;
            _.forEach(apiReqMap, function (item) {
                if (reqUrl === item.url && item.status) {
                    reqData = item.reqData;
                    reqType = item.type;
                    return false;
                }
            });
            if (reqData) {
                switch (reqType) {
                    case 1:
                        return {
                            requestData: JSON.stringify(reqData)
                        };
                        break;
                    case 2:
                        let reqForm = "";
                        for (let i in reqData) {
                            if (reqData.hasOwnProperty(i)) {
                                reqForm += `${reqForm ? '&' : ''}${reqData[i].key}=${reqData[i].value}`;
                            }
                        }
                        if (requestDetail.requestOptions.method === 'GET') {
                            const newOption = Object.assign({}, requestDetail.requestOptions);
                            newOption.path = `${requestDetail.requestOptions.path.split('?')[0]}?${reqForm}`;
                            return {
                                requestOptions: newOption
                            }
                        } else {
                            console.log(reqForm);
                            return {
                                requestData: reqForm
                            }
                        }
                        break;
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
            const formerUrl = urlReg.exec(requestDetail.url)[2];
            _.forEach(apiMap, function (item) {
                if (formerUrl === item.url && item.status) {
                    newRes.header['X-Proxy-By'] = 'YSF-MOCK';
                    newRes.body = JSON.stringify(item.json);
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
        port: proxySet.port,
        rule: rule,
        webInterface: {
            enable: true,
            webPort: proxySet.anyproxy_port,
            wsPort: proxySet.ws_port,
        },
        throttle: proxySet.throttle || '',
        forceProxyHttps: proxySet.forceProxyHttps,
        silent: false
    };
};
// --------------------------------------  开启代理服务  -------------------------------------- //
async function openAnyProxy() {
    const options = await getSetInfo();
    const proxySvr = new AnyProxy.ProxyServer(options);
    proxySvr.on('ready', () => {
        console.log("AnyProxy Server ready")
    });
    proxySvr.start();
}

export default {
    openAnyProxy
}