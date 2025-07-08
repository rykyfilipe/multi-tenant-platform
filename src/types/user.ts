/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
}

enum Role {
	"ADMIN",
	"VIEWER",
	"EDITOR",
}
