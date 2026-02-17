import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName} ${user.lastName}`;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error in checkUser:", error.message);

    // If user creation failed due to unique constraint on email,
    // try to find and update the existing user with the new Clerk ID
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      try {
        const existingUser = await db.user.findUnique({
          where: {
            email: user.emailAddresses[0].emailAddress,
          },
        });

        if (existingUser) {
          // Update the existing user with the new Clerk ID
          const updatedUser = await db.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              clerkUserId: user.id,
              name: `${user.firstName} ${user.lastName}`,
              imageUrl: user.imageUrl,
            },
          });
          return updatedUser;
        }
      } catch (updateError) {
        console.error("Error updating existing user:", updateError.message);
      }
    }

    return null;
  }
};