import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
      Proteksi semua route kecuali:
      - /
      - /login
      - /register
      - /api
      - _next
      - favicon.ico
    */
    "/((?!$|login|register|api|_next|favicon.ico|labain.png).*)",
  ],
};