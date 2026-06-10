import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const mockStudents = {
  "student123": {
    id: "student123",
    name: "John Doe",
    email: "john.doe@mars.edu",
    major: "Computer Science",
    password: "password"
  },
  "student456": {
    id: "student456",
    name: "Jane Smith",
    email: "jane.smith@mars.edu",
    major: "Electrical Engineering",
    password: "password"
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Student ID",
      credentials: {
        studentId: { label: "Student ID", type: "text", placeholder: "student123" },
        password: { label: "Password", type: "password", placeholder: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.studentId || !credentials?.password) return null;
        
        const student = mockStudents[credentials.studentId as keyof typeof mockStudents];
        
        if (student && student.password === credentials.password) {
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            major: student.major
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.major = (user as any).major;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).major = token.major;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "mars_dev_secret_key_12345",
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
