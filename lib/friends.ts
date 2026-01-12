import { prisma } from './prisma'

/**
 * Check if two users are friends (have an accepted friend request)
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      status: 'accepted',
      OR: [
        {
          senderId: userId1,
          receiverId: userId2,
        },
        {
          senderId: userId2,
          receiverId: userId1,
        },
      ],
    },
  })

  return !!friendRequest
}

/**
 * Get all friend IDs for a user
 */
export async function getFriendIds(userId: string): Promise<string[]> {
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      status: 'accepted',
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
  })

  return friendRequests.map((request) =>
    request.senderId === userId ? request.receiverId : request.senderId
  )
}





