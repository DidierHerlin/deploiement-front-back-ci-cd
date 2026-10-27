export const CHEMINS_PUBLICS = ["/", "/login", "/connexion", "/inscription", "/mot-de-passe-oublie"]

export function estPublique(pathname: string): boolean {
  return CHEMINS_PUBLICS.some(
    (chemin) => pathname === chemin || (chemin !== "/" && pathname.startsWith(`${chemin}/`))
  )
}
