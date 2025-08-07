/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	profileImage?: string;
}

export enum Role {
	VIEWER = "VIEWER",
	EDITOR = "EDITOR",
	ADMIN = "ADMIN",
}

export interface UserSchema {
	email: string;
	role: Role;
}
