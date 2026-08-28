import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.propertyId) {
    return NextResponse.json({ count: 0 });
  }
  const count = await db.alert.count({
    where: { propertyId: user.propertyId, isRead: false },
  });
  return NextResponse.json({ count });
}
