/**
 * Created by qingze
 * User: qingze
 * Date: 2017/4/14
 * Time: 下午5:36
 **/
import events from 'events'
import _ from 'lodash'
import path from 'path';

class maps extends events.EventEmitter {

    constructor(config) {
        super();

        this.map = config.map;
        this.url = config.url;

        this.urlChange(this.url);

        this.on('urlChange', this.urlChange.bind(this));
        this.on('itemAdd', this.itemAdd.bind(this));
        this.on('itemDel', this.itemDel.bind(this));
        this.on('itemEdit', this.itemEdit.bind(this));
        this.on('itemStatusChange', this.itemStatusChange.bind(this));
    }

    urlChange(url) {
        this.url = url;

        _.forEach(this.map, (item) => {
            item.url = path.join(url, item.name)
        });

    }

    itemAdd(ListItem) {
        ListItem.url = path.join(this.url, ListItem.name);

        this.map.push(ListItem);
    }

    itemDel(ListItemId) {
        this.map = _.reject(this.map, {_id: ListItemId});
    }

    itemEdit(ListItemId, ListItem) {
        this.map = _.forEach(this.map, function (item) {
            if (item.id === ListItemId) {
                _.extend(item, ListItem);
                return !1;
            }
        });
    }

    itemStatusChange(ListItemStatus,ListItemId) {
        this.map = _.forEach(this.map, (item) => {
            if (item.id === ListItemId) {
                item.status = ListItemStatus;
                return !1;
            }
        });
    }

    getMaps() {
        return this.map;
    }
}

export default maps