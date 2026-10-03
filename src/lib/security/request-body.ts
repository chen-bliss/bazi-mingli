import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 16 * 1024;

class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function readJsonBody(req: NextRequest): Promise<unknown> {
  if (
    !/^application\/json(?:;|$)/i.test(req.headers.get("content-type") ?? "")
  ) {
    throw new RequestBodyError("请使用 JSON 请求", 415);
  }
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new RequestBodyError("请求内容过大", 413);
  }
  const reader = req.body?.getReader();
  if (!reader) throw new RequestBodyError("请求内容为空", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestBodyError("请求内容过大", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestBodyError("JSON 格式无效", 400);
  }
}

export function requestErrorResponse(error: unknown, fallback: string) {
  if (error instanceof RequestBodyError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
