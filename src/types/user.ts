/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	password: string;
}

export enum Role {
	VIEWER = "VIEWER",
	EDITOR = "EDITOR",
}

export interface UserSchema {
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
	password: string;
}
