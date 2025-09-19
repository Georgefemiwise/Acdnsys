import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // 🔹 Roboflow expects a PUBLIC URL, not base64
    const roboflowRes = await fetch(
      "https://serverless.roboflow.com/infer/workflows/axient/acdns",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.ROBOFLOW_API_KEY,
          inputs: {
            image: {
              type: "url",
              value: body.imageUrl, // must be public URL
            },
          },
        }),
      }
    );

    const roboflowResult = await roboflowRes.json();

    // // 🔹 FastAPI expects { file: ... }
    // const fastApiRes = await fetch(
    //   "https://georgefemiwise-acdns.hf.space/detect",
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       file: body.imageUrl, // backend expects `file`
    //     }),
    //   }
    // );

    // const backendResult = await fastApiRes.json();

    return NextResponse.json({
      roboflow: roboflowResult,
      // backend: backendResult,
    });

    // return NextResponse.json({
    //   roboflow: roboflowResult,
    //   // backend: backendResult,
    // });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
