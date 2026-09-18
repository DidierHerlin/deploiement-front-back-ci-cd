import { NextRequest, NextResponse } from "next/server"
import { estPublique } from "@/lib/routes-publiques"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ce cookie n'est PAS le cookie de session Django (httpOnly, illisible ici) :
  // c'est un simple indicateur posé côté client après un login réussi (voir lib/auth.ts).
  // Il sert uniquement à éviter un flash de contenu protégé ; la vraie vérification
  // se fait via l'appel à /api/profil/ dans AuthGuard, et de toute façon chaque
  // endpoint Django reste protégé par IsAuthenticated côté serveur.
  const estMarqueConnecte = request.cookies.get("auth")?.value === "1"

  if (estPublique(pathname)) {
    // Si l'utilisateur est déjà connecté et tente d'aller sur login/inscription,
    // on le renvoie vers la racine qui le dispatchera vers le bon dashboard.
    if (estMarqueConnecte && (pathname === "/login" || pathname === "/inscription" || pathname === "/mot-de-passe-oublie")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!estMarqueConnecte) {
    const urlLogin = new URL("/login", request.url)
    urlLogin.searchParams.set("redirect", pathname)
    return NextResponse.redirect(urlLogin)
  }

  return NextResponse.next()
}

export const config = {
  // Exclut les assets statiques et les fichiers publics du dossier /public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}