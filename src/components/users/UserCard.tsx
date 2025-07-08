/** @format */

import { User } from "@/types/user";

interface Props {
	user: User;
}

function UserCard({ user }: Props) {
	return <div>{user.email}</div>;
}

export default UserCard;
