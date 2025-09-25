import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasToken: !!process.env.ONECLICK_API_TOKEN,
    tokenLength: process.env.ONECLICK_API_TOKEN?.length || 0,
    baseUrl: process.env.ONECLICK_API_BASE || 'https://1click.chaindefuser.com',
    nodeEnv: process.env.NODE_ENV
  });
}
