'use client'

import { useMemo, useState, useEffect } from 'react'
import { getAllUsers, deleteUser, createUser, updateUser, UserProfil } from '@/lib/api'

// Composants globaux réutilisables
import { UserTable } from "@/components/organisms/UserTable"
import { UserForm } from "@/components/organisms/UserForm"
import { UserModal } from "@/components/organisms/UserModal"
import { DeleteConfirmModal } from "@/components/organisms/DeleteConfirmModal"

// Composants spécifiques à la page Utilisateur
import { UserPageHeader } from "@/components/organisms/UserPageHeader"
import { UserSearch } from "@/components/organisms/UserSearch"
import { UserFilters } from "@/components/organisms/UserFilters"

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UserProfil[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous les rôles')
  
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfil | null>(null)
  const [viewUser, setViewUser] = useState<UserProfil | null>(null)

  const defaultNewUser = { nom: '', prenoms: '', email: '', role: 'Agent', password: '', telephone: '' }
  const [newUser, setNewUser] = useState(defaultNewUser)
  
  const [userToDelete, setUserToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => users.filter((user) => {
    const fullName = `${user.prenoms} ${user.nom}`.toLowerCase()
    const matchQuery = fullName.includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())
    
    const roleMap: Record<string, string> = { 'ADMIN': 'Admin', 'AGENT': 'Agent', 'PROPRIETAIRE': 'Propriétaire', 'LOCATAIRE': 'Locataire' }
    const uiRole = roleMap[user.role] || user.role
    
    const matchRole = roleFilter === 'Tous les rôles' || uiRole === roleFilter
    return matchQuery && matchRole
  }), [users, query, roleFilter])

  async function handleSaveUser(event: React.FormEvent) {
    event.preventDefault()
    try {
      if (editingUser) {
        const payload: any = {
          nom: newUser.nom,
          prenoms: newUser.prenoms,
          email: newUser.email,
          role: newUser.role === 'Admin' ? 'ADMIN' : newUser.role === 'Agent' ? 'AGENT' : newUser.role === 'Propriétaire' ? 'PROPRIETAIRE' : 'LOCATAIRE',
          telephone: newUser.telephone
        }
        if (newUser.password) {
           payload.password = newUser.password
        }
        await updateUser(editingUser.id, payload)
      } else {
        if (!newUser.password) return alert("Mot de passe requis pour un nouvel utilisateur")
        await createUser(newUser)
      }
      await fetchUsers()
      setShowUserModal(false)
      setEditingUser(null)
      setNewUser(defaultNewUser)
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'enregistrement")
    }
  }

  function openEditModal(user: UserProfil) {
    setEditingUser(user)
    const roleMap: Record<string, string> = { 'ADMIN': 'Admin', 'AGENT': 'Agent', 'PROPRIETAIRE': 'Propriétaire', 'LOCATAIRE': 'Locataire' }
    setNewUser({
      nom: user.nom,
      prenoms: user.prenoms,
      email: user.email,
      telephone: user.telephone || '',
      role: roleMap[user.role] || user.role,
      password: ''
    })
    setShowUserModal(true)
  }

  async function confirmDelete() {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete)
      await fetchUsers()
      setUserToDelete(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function toggleStatus(user: UserProfil) {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      await fetchUsers()
    } catch (e: any) {
      alert("Erreur: " + e.message)
    }
  }

  const handleCreateNewUserClick = () => {
    setEditingUser(null)
    setNewUser(defaultNewUser)
    setShowUserModal(true)
  }

  return (
    <>
      <UserPageHeader onCreateClick={handleCreateNewUserClick} />

      <section className="panel user-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="user-toolbar">
          <UserSearch query={query} onQueryChange={setQuery} />
          <UserFilters roleFilter={roleFilter} onRoleFilterChange={setRoleFilter} />
        </div>
        
        {/* Composant de tableau réutilisable */}
        <UserTable 
          users={filteredUsers} 
          loading={loading} 
          onView={setViewUser} 
          onEdit={openEditModal} 
          onToggleStatus={toggleStatus} 
          onDelete={setUserToDelete} 
        />
      </section>

      {/* Les Modals encapsulées */}
      {showUserModal && (
        <UserForm 
          editingUser={editingUser} 
          newUser={newUser} 
          setNewUser={setNewUser} 
          onClose={() => setShowUserModal(false)} 
          onSubmit={handleSaveUser} 
        />
      )}

      {viewUser && (
        <UserModal 
          user={viewUser} 
          onClose={() => setViewUser(null)} 
          onEdit={() => { setViewUser(null); openEditModal(viewUser); }} 
        />
      )}

      {userToDelete && (
        <DeleteConfirmModal 
          onCancel={() => setUserToDelete(null)} 
          onConfirm={confirmDelete} 
        />
      )}
    </>
  )
}
