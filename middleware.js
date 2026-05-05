import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!$|login|register|check-email|verify-email|api|_next|favicon.ico|labain.png).*)",
  ],
};