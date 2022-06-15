import { User } from "./User";
import bcrypt from "bcryptjs";

const saltRounds = 10;

export class UserResults {
	constructor(public messages?: Array<string>, public user?: User) {}
}

export const register = async (
	email: string,
	userName: string,
	password: string
): Promise<UserResults> => {
	const salt = await bcrypt.genSalt(saltRounds);
	const hashedPassword = await bcrypt.hash(password, salt);

	let userEntity;
	try {
		userEntity = await User.create({
			email,
			userName,
			password: hashedPassword,
		}).save();
	} catch (e) {
		console.log(e);
	}

	if (userEntity) userEntity.password = "";

	return {
		user: userEntity,
	};
};

export const login = async (userName: string, password: string) => {
	const user = await User.findOne({
		where: { userName },
	});
	const passwordMatch = await bcrypt.compare(password, user?.password || "");

	return { passwordMatch };
};
