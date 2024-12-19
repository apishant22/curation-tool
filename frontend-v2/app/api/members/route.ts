/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/members/route.js
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/members
export async function GET() {
  try {
    const members = await prisma.email_Access.findMany({
      where: {
        blacklisted: false,
      },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST /api/members
export async function POST(request) {
  try {
    const { email } = await request.json();
    const member = await prisma.email_Access.create({
      data: {
        email: email,
        admin: true,
        blacklisted: false,
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
