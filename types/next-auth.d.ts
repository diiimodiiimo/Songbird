import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      username?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    username?: string | null
  }
}


