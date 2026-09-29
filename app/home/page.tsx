import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import HomeChat from "./HomeChat";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.split(" ")[0]; // nama depan saja

  return <HomeChat userName={userName} />;
}