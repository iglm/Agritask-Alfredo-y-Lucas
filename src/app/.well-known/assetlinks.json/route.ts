import { NextResponse } from 'next/server';
import assetLinks from '@/lib/assetlinks.json';

// This route handler ensures that the assetlinks.json file is always served correctly.
export async function GET() {
  return NextResponse.json(assetLinks);
}
