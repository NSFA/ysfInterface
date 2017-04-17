/**
 * 拦截列表类
 * User: qingze
 * Date: 2017/4/14
 * Time: 下午5:36
 **/
import events from 'events'
import _ from 'lodash'
import path from 'path';

import logUtil from'../../proxy/lib/log'

class maps extends events.EventEmitter {

    constructor(config) {
        super();
        config = config || {};

        this.map = config.map;
        this.url = config.url;
        this.listType = config.listType;

        this.urlInit(this.url);

    }

    /**
     * 初始化拦截URL
     * @param url
     */
    urlInit(url) {
        this.url = url;

        _.forEach(this.map, (item) => {
            item.url = path.join(url, item.name)
        });

        logUtil.printLog(`${this.listType} Maps: 拦截url初始化`)

    }

    /**
     * 拦截URL改变
     * @param url
     */
    urlChange(url) {
        this.url = url;

        _.forEach(this.map, (item) => {
            item.url = path.join(url, item.name)
        });

        this.emit('proxyUrl', url);

        logUtil.printLog(`${this.listType} Maps: 拦截url改变-${url}`)
    }

    /**
     * 拦截项增加
     * @param ListItem
     */
    itemAdd(ListItem) {
        ListItem.url = path.join(this.url, ListItem.name);

        this.map.push(ListItem);

        logUtil.printLog(`${this.listType} Maps: 拦截项-${ListItem.name}-增加成功`)

    }

    /**
     * 拦截项删除
     * @param ListItemId
     */
    itemDel(ListItemId) {
        this.map = _.reject(this.map, {id: ListItemId});

        logUtil.printLog(`${this.listType} Maps: 拦截项-${ListItemId}-删除成功`)
    }

    /**
     * 拦截项编辑
     * @param ListItemId
     * @param ListItem
     */
    itemEdit(ListItemId, ListItem) {
        this.map = _.forEach(this.map, function (item) {
            if (item.id === ListItemId) {
                _.extend(item, ListItem);
                return !1;
            }
        });

        logUtil.printLog(`${this.listType} Maps: 拦截项-${ListItemId}-编辑成功`)
    }

    /**
     * 拦截项状态改变
     * @param ListItemStatus
     * @param ListItemId
     */
    itemStatusChange(ListItemStatus, ListItemId) {
        this.map = _.forEach(this.map, (item) => {
            if (item.id === ListItemId) {
                item.status = ListItemStatus;
                return !1;
            }
        });

        logUtil.printLog(`${this.listType} Maps: 拦截开关-${ListItemStatus?"开启":"关闭"}成功`)

    }

    /**
     * 获取拦截表
     * @returns {*}
     */
    getMaps() {
        return this.map;
    }
}

export default maps