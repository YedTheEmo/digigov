import { NextRequest, NextResponse } from 'next/server';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const targetPath = join(process.cwd(), 'public', 'uploads', key);
  const dir = dirname(targetPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(targetPath, buffer);
  return new NextResponse(null, { status: 204 });
}


