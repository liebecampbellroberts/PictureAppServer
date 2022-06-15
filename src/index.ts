import { login, register } from "./repo/UserRepo";

const express = require("express");
const session = require("express-session");
const connectRedis = require("connect-redis");
const Redis = require("ioredis");
let bodyParser = require("body-parser");
const typeorm = require("typeorm");

const main = async () => {
	require("dotenv").config();

	const app = express();
	const router = express.Router();

	let connection;
	try {
		connection = await typeorm.createConnection();
	} catch (e) {
		console.log(`error: ${e}`);
	}

	connection.synchronize();

	console.log(`is connected: ${connection.isConnected}`);

	app.use(bodyParser());

	const redis = new Redis({
		port: Number(process.env.REDIS_PORT),
		host: process.env.REDIS_HOST,
	});

	const RedisStore = new connectRedis(session);
	const redisStore = new RedisStore({
		client: redis,
	});

	app.use(
		session({
			store: redisStore,
			name: process.env.COOKIE_NAME,
			sameSite: "Strict",
			secret: process.env.SESSION_SECRET,
			resave: true,
			saveUninitialized: false,
			cookie: {
				path: "/",
				httpOnly: true,
				secure: false,
				maxAge: 1000 * 60,
			} as any,
		})
	);

	app.use(router);

	const isValid = async (username: string, password: string) => {
		const { passwordMatch } = await login(username, password);
		return passwordMatch;
	};

	router.get("/", (req, res) => {
		res.send({ isValid: !!req.session!.username });
	});

	interface ResponseMessage {
		username?: string;
		loadCount?: number;
		message?: string;
		passwordValid?: boolean;
		logOut?: boolean;
	}

	router.post("/", async (req, res, next) => {
		const { username, password } = req.body;
		const validCredentials = await isValid(username, password);
		let responseMessage: ResponseMessage = {};

		if (!req.session!.username && validCredentials) {
			req.session!.username = username;
			console.log(`User ${req.session!.username} is now set`);
			req.session!.loadCount = 0;
			responseMessage = {
				username: req.session!.username,
				loadCount: req.session!.loadCount,
				message: `new session`,
				passwordValid: true,
			};
		} else if (req.session!.username) {
			console.log(`session is valid`);
			req.session!.loadCount = Number(req.session!.loadCount) + 1;
			responseMessage = {
				...responseMessage,
				username: req.session!.username,
				loadCount: req.session!.loadCount,
				message: `valid session`,
				passwordValid: false,
			};
		} else if (!req.session!.username && !validCredentials) {
			responseMessage = {
				...responseMessage,
				message: `username/password is incorrect`,
				passwordValid: false,
			};
		}

		res.send({ ...responseMessage });
	});

	router.post("/logOut", (req, res, next) => {
		req.session?.destroy();

		res.send({
			message: `successfully logged out`,
		});
	});

	router.post("/login", async (req, res, next) => {
		const { passwordMatch } = await login(req.body.username, req.body.password);
		res.send(passwordMatch);
	});

	router.post("/register", async (req, res, next) => {
		console.log(req.body);
		const { password, email, username } = req.body;
		const registerUser = await register(email, username, password);
		console.log(registerUser.user);
		res.send(registerUser.user ? true : false);
	});

	app.listen({ port: process.env.SERVER_PORT }, () => {
		console.log(`Server ready on port ${process.env.SERVER_PORT}`);
	});
};

main();
