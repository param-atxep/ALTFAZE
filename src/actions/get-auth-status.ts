"use server";

import { db } from "@/lib";
import { currentUser } from "@clerk/nextjs/server";

const getAuthStatus = async () => {
    const user = await currentUser();

    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
        return { error: "User not found" };
    }

    const existingUser = await db.user.findFirst({
        where: {
            email: user.primaryEmailAddress.emailAddress,
        },
    });

    console.log("existingUser", existingUser);

    if (!existingUser) {
        await db.user.create({
            data: {
                email: user.primaryEmailAddress.emailAddress,
                name: user.fullName || user.firstName,
                image: user.imageUrl,
            },
        });
    }

    return { success: true };
};

export default getAuthStatus;
