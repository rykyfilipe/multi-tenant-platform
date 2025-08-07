/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	profileImage?: string;
	tenantId?: string | null;
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
