"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const getAuthStatus = async () => {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { error: "User not found" };
    }

    const existingUser = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (!existingUser) {
        await db.user.create({
            data: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            },
        });
    }

    return { success: true };
};

export default getAuthStatus;
