import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET brand persona
export async function GET() {
  try {
    // Get the first (and should be only) brand persona
    const persona = await prisma.brandPersona.findFirst();

    if (!persona) {
      return NextResponse.json({ description: "" });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error("Error fetching brand persona:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand persona" },
      { status: 500 }
    );
  }
}

// POST/UPDATE brand persona
export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Check if a persona already exists
    const existingPersona = await prisma.brandPersona.findFirst();

    let persona;
    if (existingPersona) {
      // Update existing persona
      persona = await prisma.brandPersona.update({
        where: { id: existingPersona.id },
        data: { description: description.trim() },
      });
    } else {
      // Create new persona
      persona = await prisma.brandPersona.create({
        data: { description: description.trim() },
      });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error("Error saving brand persona:", error);
    return NextResponse.json(
      { error: "Failed to save brand persona" },
      { status: 500 }
    );
  }
}
