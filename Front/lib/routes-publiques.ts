export const CHEMINS_PUBLICS = ["/login", "/inscription", "/mot-de-passe-oublie"]

export function estPublique(pathname: string): boolean {
  return CHEMINS_PUBLICS.some(
    (chemin) => pathname === chemin || pathname.startsWith(`${chemin}/`)
  )
}