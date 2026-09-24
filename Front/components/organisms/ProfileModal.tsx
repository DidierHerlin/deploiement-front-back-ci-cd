'use client'


import React, { useState, useRef } from 'react';
import { X, UserRound, LockKeyhole, Edit2, Loader2, Save, Upload } from 'lucide-react';
import { updateProfil, getUserPhotoSrc, resolveMediaUrl } from '@/lib/api';

import { getUserFullName } from "@/components/organisms/userUtils";

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
}

export function ProfileModal({ user, onClose, onProfileUpdated }: ProfileModalProps) {
  const fullName = getUserFullName(user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenoms: user?.prenoms || '',
    telephone: user?.telephone || '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(getUserPhotoSrc(user));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.append('nom', formData.nom);
      payload.append('prenoms', formData.prenoms);
      payload.append('telephone', formData.telephone);
      if (photoFile) {
        payload.append('photo_profil', photoFile);
      }
      
      const response = await updateProfil(payload);
      if (onProfileUpdated) {
        onProfileUpdated(response);
      } else {
        window.location.reload();
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>
        
        <div className="modal-icon" style={{ overflow: 'hidden', padding: photoPreview ? 0 : undefined }}>
          {photoPreview ? (
            <img src={resolveMediaUrl(photoPreview) ?? ""} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserRound size={20} />
          )}
        </div>
        
        <h2 id="profile-title">Mon profil</h2>
        <p>Informations personnelles de votre compte locataire.</p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!isEditing ? (
          <>
            <div className="profile-fields">
              <div><span>Nom complet</span><strong>{fullName}</strong></div>
              <div><span>Adresse email</span><strong>{user?.email}</strong></div>
              <div><span>Téléphone</span><strong>{user?.telephone || 'Non renseigné'}</strong></div>
              <div><span>Rôle actif</span><strong>Locataire</strong></div>
              <div><span>Statut du compte</span><strong className="status paid"><i />Actif</strong></div>
            </div>
            
            <div className="password-note">
              <LockKeyhole size={15} />
              <span>Vos documents et données contractuelles sont accessibles uniquement depuis votre espace sécurisé.</span>
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="outline-button" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={16} /> Modifier mon profil
              </button>
              <button className="primary-button" onClick={onClose}>Fermer</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Photo de profil</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
              <button type="button" className="outline-button" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                <Upload size={14} /> Choisir une image
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Prénoms</label>
              <input type="text" name="prenoms" value={formData.prenoms} onChange={handleChange} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Téléphone</label>
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" className="outline-button" onClick={() => { setIsEditing(false); setPhotoPreview(getUserPhotoSrc(user)); setPhotoFile(null); }} disabled={loading}>
                Annuler
              </button>
              <button type="submit" className="primary-button" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
