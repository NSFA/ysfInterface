/**
 * AnyProxy
 * Created by qingze
 * Date: 2017/3/23
 * Time: 下午6:28
 **/
import _ from 'lodash';
import {ThrottleGroup} from 'stream-throttle'

import setting from '../models/setting'
import apiList from '../models/apiResList'
import apiReqList from '../models/apiReqList'

import AnyProxy from '../../proxy/proxy'
import logUtil from'../../proxy/lib/log'

import apiMaps from './maps'

const getSetInfo = async () => {

    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    const apiReqSet = await apiReqList.getReqApiList();

    let proxyUrl = proxySet.result.url; // 区分二级域名

    // --------------------------------------  事件监听  -------------------------------------- //

    //响应拦截表
    global.resMaps = new apiMaps({
        url: proxyUrl,
        map: apiSet.result,
        listType: "响应拦截"
    });

    //请求拦截表
    global.reqMaps = new apiMaps({
        url: proxyUrl,
        map: apiReqSet.result,
        listType: '请求拦截'
    });

    //监听一个url改变
    global.resMaps.on('proxyUrl', function (url) {
        if (proxyUrl !== url) {
            proxyUrl = url;
            logUtil.printLog('Proxy : 拦截url改变 ')
        }
    });

    // --------------------------------------  rule  -------------------------------------- //
    const rule = {
        async beforeSendRequest(requestDetail) {
            const hostname = requestDetail.requestOptions.hostname;
            const path = requestDetail.requestOptions.path.split('?')[0];
            let reqData, reqType;

            let reqMaps = global.reqMaps.getMaps();

            _.forEach(reqMaps, function (item) {
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

            let resMaps = global.resMaps.getMaps();

            _.forEach(resMaps, function (item) {
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
