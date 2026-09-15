import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json() 
    ),
    transports: [

        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...metadata }) => {
                    const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : "";
                    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
                })
            )
        }),
        //for error loggin
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        //for all kind of logs
        new winston.transports.File({ filename: "logs/combined.log" })
    ]
});

export default logger;