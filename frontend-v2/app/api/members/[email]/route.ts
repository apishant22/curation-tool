/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/members/[email]/route.js
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// DELETE /api/members/[email]
export async function DELETE(request, { params }) {
  try {
    const { email } = params;
    await prisma.email_Access.delete({
      where: {
        email: email,
      },
    });
    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
