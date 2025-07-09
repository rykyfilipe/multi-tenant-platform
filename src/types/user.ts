/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
}

export enum Role {
	ADMIN = "ADMIN",
	VIEWER = "VIEWER",
	EDITOR = "EDITOR",
}
