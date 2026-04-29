import log4js from "log4js";


log4js.configure({
  appenders: { 
    appLog: { type: "file", filename: "app.log" },
    console: { type: "console" }
  },
  categories: { 
    default: { appenders: ["appLog", "console"], level: "all" } 
  }
});

const logger = log4js.getLogger();

export { logger }