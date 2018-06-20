// Logging
import * as winston from "winston";

export const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			// timestamp : true,
			// colorize : true,
			level: "info",
		}),
		new winston.transports.File({
			filename: "./logs/airwm.log",
		}),
	],
});
