import { NextRequest, NextResponse } from 'next/server'

function getApiV1() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '')
}

function setRefreshTokenCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const refreshToken = body?.refreshToken || request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 })
    }

    const upstream = await fetch(`${getApiV1()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })

    const json = await upstream.json().catch(() => ({}))

    if (!upstream.ok) {
      const response = NextResponse.json(json, { status: upstream.status })
      response.cookies.delete('refreshToken')
      return response
    }

    const payload = json?.data ?? json
    const response = NextResponse.json({ success: true, data: payload })

    if (payload?.refreshToken) {
      setRefreshTokenCookie(response, payload.refreshToken)
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
