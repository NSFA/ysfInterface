/**
 * log 日志监控文件
 *
 * @author:   波比(｡･∀･)ﾉﾞ
 * @date:     2017-03-23  下午3:27
 */

import fs from 'fs';
import path from 'path';
import winston from 'winston';

const filename = path.join(__dirname, 'logfile.log');

try { fs.unlinkSync(filename); }
catch (ex) { }

const logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)(),
		new (winston.transports.File)({ filename: filename })
	]
});


export default logger;
