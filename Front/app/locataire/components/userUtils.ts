export function getUserFullName(user: any, fallback = 'Thomas Bernard') {
  if (!user) return fallback;
  const prenoms = user.prenoms || '';
  const nom = user.nom || '';
  const fullName = `${prenoms} ${nom}`.trim();
  return fullName.length > 0 ? fullName : fallback;
}

export function getUserInitials(user: any, fallback = 'TB') {
  if (!user) return fallback;
  const p = (user.prenoms || '').trim();
  const n = (user.nom || '').trim();
  
  if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
  if (p) return p.substring(0, 2).toUpperCase();
  if (n) return n.substring(0, 2).toUpperCase();
  return fallback;
}

export function getUserFirstName(user: any, fallback = 'Locataire') {
  if (!user) return fallback;
  const p = (user.prenoms || '').trim();
  if (p) return p.split(' ')[0];
  const n = (user.nom || '').trim();
  return n ? n : fallback;
}
