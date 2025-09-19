import { NextResponse } from "next/server";

// For now, store in-memory (replace with DB later)
let plates: string[] = [];

export async function GET() {
  return NextResponse.json({ plates });
}

export async function POST(req: Request) {
  const { plate } = await req.json();
  if (!plate) {
    return NextResponse.json({ error: "Plate is required" }, { status: 400 });
  }

  plates.push(plate);
  
  return NextResponse.json({ message: "Plate saved", plates });
}
