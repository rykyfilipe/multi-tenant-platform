/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
}

export enum Role {
	VIEWER = "VIEWER",
	EDITOR = "EDITOR",
	ADMIN = "ADMIN",
}

export interface UserSchema {
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
	password: string;
}
