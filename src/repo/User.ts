import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity({ name: "Users", database: "PictureApp" })
export class User extends BaseEntity {
	@PrimaryGeneratedColumn({ name: "id", type: "bigint" })
	id: string;

	@Column("varchar", {
		name: "Email",
		length: 120,
		unique: true,
		nullable: false,
	})
	email: string;

	@Column("varchar", {
		name: "UserName",
		length: 60,
		unique: true,
		nullable: false,
	})
	userName: string;

	@Column("varchar", {
		name: "Password",
		length: 100,
		nullable: false,
	})
	password: string;

	@Column("boolean", {
		name: "Confirmed",
		default: false,
		nullable: false,
	})
	confirmed: boolean;
}
