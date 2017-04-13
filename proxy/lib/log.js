'use strict';

const color = require('colorful');
const util = require('./util');

let ifPrint = true;
let logLevel = 0;
const LogLevelMap = {
  tip: 0,
  system_error: 1,
  rule_error: 2,
  debug: 3,
};

/**
 * 是否开启log
 * @param status
 */
function setPrintStatus(status) {
  ifPrint = !!status;
}

/**
 * 设置log等级
 * @param level
 */
function setLogLevel(level) {
  logLevel = parseInt(level, 10);
}

/**
 * print-log
 * @param content
 * @param type
 */
function printLog(content, type) {
  if (!ifPrint) {
    return;
  }
  const timeString = util.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss');
  switch (type) {
    case LogLevelMap.tip: {
      if (logLevel > 0) {
        return;
      }
      console.log(color.cyan(`[Proxy Log][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.system_error: {
      if (logLevel > 1) {
        return;
      }
      console.error(color.red(`[Proxy ERROR][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.rule_error: {
      if (logLevel > 2) {
        return;
      }

      console.error(color.red(`[Proxy RULE_ERROR][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.debug: {
      return;
    }

    default : {
      console.log(color.cyan(`[Proxy Log][${timeString}]: ` + content));
      break;
    }
  }
}

module.exports.printLog = printLog;
module.exports.setPrintStatus = setPrintStatus;
module.exports.setLogLevel = setLogLevel;
module.exports.T_TIP = LogLevelMap.tip;
module.exports.T_ERR = LogLevelMap.system_error;
module.exports.T_RULE_ERROR = LogLevelMap.rule_error;
module.exports.T_DEBUG = LogLevelMap.debug;
