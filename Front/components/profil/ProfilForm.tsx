"use client";

import React, { useState } from "react";
import { UserProfil, updateProfil } from "@/lib/api";
import { Camera, CheckCircle, AlertCircle, Save } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

interface ProfilFormProps {
  initialData: UserProfil;
  onUpdate: (data: UserProfil) => void;
}

export default function ProfilForm({ initialData, onUpdate }: ProfilFormProps) {
  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    prenoms: initialData.prenoms || "",
    email: initialData.email || "",
    telephone: initialData.telephone || "",
    current_password: "",
    new_password: "",
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.photo_url);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPhotoPreview(imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = new FormData();
      
      // Only append fields that have changed or are required
      if (formData.nom !== initialData.nom) payload.append("nom", formData.nom);
      if (formData.prenoms !== initialData.prenoms) payload.append("prenoms", formData.prenoms);
      if (formData.email !== initialData.email) payload.append("email", formData.email);
      if (formData.telephone !== initialData.telephone) payload.append("telephone", formData.telephone);
      
      // Password change
      if (formData.new_password) {
        if (!formData.current_password) {
          throw new Error("Vous devez fournir votre mot de passe actuel pour le modifier.");
        }
        payload.append("current_password", formData.current_password);
        payload.append("new_password", formData.new_password);
      }

      // Photo
      if (photoFile) {
        payload.append("photo_profil", photoFile);
      }

      // Check if there is anything to update
      let hasUpdates = false;
      for (const value of payload.values()) {
         hasUpdates = true;
         break;
      }
      
      if (!hasUpdates) {
        setLoading(false);
        setSuccessMsg("Aucune modification à enregistrer.");
        return;
      }

      const updatedProfil = await updateProfil(payload);
      onUpdate(updatedProfil);
      
      setFormData(prev => ({
        ...prev,
        current_password: "",
        new_password: ""
      }));
      setPhotoFile(null);
      
      setSuccessMsg("Votre profil a été mis à jour avec succès.");
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
      
    } catch (err: any) {
      let errorMessage = "Une erreur est survenue lors de la mise à jour.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.message) {
          errorMessage = parsed.message;
          if (parsed.details) {
            // Flatten the details object into a readable string
            const detailStr = Object.entries(parsed.details)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
              .join(" | ");
            errorMessage += ` (${detailStr})`;
          }
        }
      } catch {
        errorMessage = err.message || errorMessage;
      }
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Alertes de succès / erreur */}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-md flex items-start">
          <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Colonne Photo de profil */}
        <div className="flex flex-col items-center space-y-4 md:w-1/3">
          <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 shadow-sm flex items-center justify-center">
            {photoPreview ? (
              <img 
                src={photoPreview.startsWith("http") ? photoPreview : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"}${photoPreview}`} 
                alt="Photo de profil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-gray-400 dark:text-gray-500 font-semibold">
                {formData.prenoms.charAt(0)}{formData.nom.charAt(0)}
              </span>
            )}
            
            <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-medium">Modifier</span>
            </label>
            <input 
              id="photo-upload" 
              type="file" 
              accept="image/jpeg, image/png, image/gif" 
              className="hidden" 
              onChange={handlePhotoChange}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rôle : <span className="uppercase text-blue-600 dark:text-blue-400">{initialData.role}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Membre depuis le {new Date(initialData.date_creation).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Colonne Champs du formulaire */}
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prénoms</label>
              <input
                type="text"
                name="prenoms"
                value={formData.prenoms}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Changer de mot de passe (optionnel)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe actuel</label>
                <PasswordInput
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
                <PasswordInput
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  minLength={8}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Enregistrer les modifications
        </button>
      </div>

    </form>
  );
}
