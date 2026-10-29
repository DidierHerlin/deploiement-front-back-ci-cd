'use client'

import React, { useState, useRef } from 'react';
import { X, UserRound, LockKeyhole, Edit2, Loader2, Save, Upload } from 'lucide-react';
import { updateProfil, getUserPhotoSrc, resolveMediaUrl } from '@/lib/api';
import { getUserFullName } from "@/components/organisms/userUtils";
import { useTranslation } from '@/lib/i18n';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
}

export function ProfileModal({ user, onClose, onProfileUpdated }: ProfileModalProps) {
  const { t } = useTranslation();
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
      setError(err.message || t("profile.update_error", 'Erreur lors de la mise à jour du profil'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="presentation">
      <section 
        className="modal profile-modal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-[460px] p-6 relative overflow-y-auto max-h-[90vh]" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="profile-title"
      >
        <button 
          className="modal-close cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors absolute top-5 right-5" 
          onClick={onClose} 
          aria-label={t("modal.close", "Fermer")}
        >
          <X size={18} />
        </button>
        
        <div className="modal-icon dark:bg-slate-800 dark:text-blue-400" style={{ overflow: 'hidden', padding: photoPreview ? 0 : undefined }}>
          {photoPreview ? (
            <img src={resolveMediaUrl(photoPreview) ?? ""} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserRound size={20} />
          )}
        </div>
        
        <h2 id="profile-title" className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-1 mt-3">
          {t("dashboard.locataire.my_profile", "Mon profil")}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
          {t("dashboard.locataire.welcome_desc", "Informations personnelles de votre compte.")}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-xs">
            {error}
          </div>
        )}

        {!isEditing ? (
          <>
            <div className="profile-fields grid grid-cols-2 gap-4 mb-5">
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("profile.last_name", "Nom")} & {t("profile.first_name", "Prénom")}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{fullName}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("profile.email", "Adresse email")}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm truncate block">{user?.email}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("profile.phone", "Téléphone")}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{user?.telephone || '-'}</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("profile.role", "Rôle")}</span><strong className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{t(`dashboard.roles.${user?.role || 'LOCATAIRE'}`, user?.role || 'Locataire')}</strong></div>
              <div className="col-span-2"><span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">{t("dashboard.common.actions", "Statut du compte")}</span><strong className="status paid"><i />{t("dashboard.common.status_actif", "Actif")}</strong></div>
            </div>
            
            <div className="password-note bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 rounded-xl p-3 flex items-start gap-2.5 text-xs mb-5">
              <LockKeyhole size={15} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <span>{t("dashboard.locataire.security_sub", "Vos documents et données sont sécurisés et strictement personnels.")}</span>
            </div>
            
            <div className="modal-actions flex justify-between items-center pt-2">
              <button 
                className="outline-button cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2" 
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={15} /> {t("dashboard.common.edit", "Modifier")}
              </button>
              <button className="primary-button cursor-pointer" onClick={onClose}>{t("modal.close", "Fermer")}</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("profile.modify_photo", "Photo de profil")}</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
              <button 
                type="button" 
                className="outline-button cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 w-fit" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> {t("profile.modify_photo", "Choisir une image")}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("profile.first_name", "Prénoms")}</label>
              <input 
                type="text" 
                name="prenoms" 
                value={formData.prenoms} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("profile.last_name", "Nom")}</label>
              <input 
                type="text" 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("profile.phone", "Téléphone")}</label>
              <input 
                type="tel" 
                name="telephone" 
                value={formData.telephone} 
                onChange={handleChange} 
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div className="modal-actions flex justify-between items-center pt-3">
              <button 
                type="button" 
                className="outline-button cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700" 
                onClick={() => { setIsEditing(false); setPhotoPreview(getUserPhotoSrc(user)); setPhotoFile(null); }} 
                disabled={loading}
              >
                {t("dashboard.common.cancel", "Annuler")}
              </button>
              <button 
                type="submit" 
                className="primary-button cursor-pointer flex items-center gap-2" 
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {t("dashboard.common.save", "Enregistrer")}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
