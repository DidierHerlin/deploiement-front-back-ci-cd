import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const API_URL = getApiUrl()
  
  try {
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    const res = await fetch(`${API_URL}/paiements/${id}/quittance/`, {
      headers
    })

    if (!res.ok) {
      return NextResponse.json({ error: "API backend error" }, { status: res.status })
    }

    const blob = await res.blob()
    const headersResponse = new Headers()
    headersResponse.set('Content-Type', 'application/pdf')
    headersResponse.set('Content-Disposition', `attachment; filename="quittance_${id}.pdf"`)

    return new NextResponse(blob, {
      status: 200,
      headers: headersResponse
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
