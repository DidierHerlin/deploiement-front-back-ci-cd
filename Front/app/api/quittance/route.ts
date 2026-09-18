import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) {
    return NextResponse.json({ error: "Missing id or token" }, { status: 400 })
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
  
  try {
    const res = await fetch(`${API_URL}/paiements/${id}/quittance/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      return NextResponse.json({ error: "API backend error" }, { status: res.status })
    }

    const blob = await res.blob()
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="quittance_${id}.pdf"`)

    return new NextResponse(blob, {
      status: 200,
      headers
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
