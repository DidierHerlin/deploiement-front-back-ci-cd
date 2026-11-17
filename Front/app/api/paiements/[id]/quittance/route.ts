import { NextRequest, NextResponse } from "next/server"
import { getApiUrl } from "@/lib/config"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(context.params)
  const id = resolvedParams?.id

  if (!id) {
    return NextResponse.json({ error: "Identifiant de paiement manquant." }, { status: 400 })
  }

  // 1. Récupération du token JWT (Cookie, Header Authorization ou Paramètre URL)
  const token =
    request.cookies.get("access_token")?.value ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.nextUrl.searchParams.get("token")

  const estMarqueConnecte = request.cookies.get("auth")?.value === "1"

  // 2. Si le token est absent dans les cookies et headers
  if (!token) {
    // Si la session est marquée connectée (token présent dans le localStorage côté client),
    // on renvoie une page passerelle pour synchroniser le cookie et déclencher le téléchargement.
    if (estMarqueConnecte) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Téléchargement de la quittance...</title>
</head>
<body>
  <p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #475569;">
    Téléchargement de votre quittance en cours...
  </p>
  <script>
    (function() {
      var t = localStorage.getItem("access_token");
      if (t) {
        document.cookie = "access_token=" + t + "; path=/; max-age=1209600; samesite=lax";
        window.location.reload();
      } else {
        window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      }
    })();
  </script>
</body>
</html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      )
    }

    // Sinon, redirection vers /login en mémorisant la destination
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", `/api/paiements/${id}/quittance`)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Appel sécurisé au backend Django
  const API_URL = getApiUrl()

  try {
    const backendRes = await fetch(`${API_URL}/paiements/${id}/quittance/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Token expiré ou non reconnu par Django -> Redirection vers login
    if (backendRes.status === 401) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", `/api/paiements/${id}/quittance`)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete("access_token")
      res.cookies.delete("auth")
      return res
    }

    // Contrôle d'autorisation : le locataire n'est pas autorisé ou la quittance n'existe pas
    if (backendRes.status === 403 || backendRes.status === 404) {
      return NextResponse.json(
        { error: "Accès refusé. Vous n'êtes pas autorisé à consulter ou télécharger cette quittance." },
        { status: 403 }
      )
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Impossible de récupérer la quittance auprès du serveur." },
        { status: backendRes.status }
      )
    }

    // 4. Renvoi du PDF en pièce jointe avec en-têtes explicites
    const blob = await backendRes.blob()
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="quittance-${id}.pdf"`)
    headers.set("Cache-Control", "no-store, max-age=0")

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur lors du téléchargement de la quittance." },
      { status: 500 }
    )
  }
}
