'use client'

import React from 'react';
import { Menu, ChevronRight, Bell, ChevronDown } from 'lucide-react';

interface LocataireTopbarProps {
  setMobileNav: (open: boolean) => void;
  setShowProfile: (open: boolean) => void;
  activeLabel: string;
  user: any;
}

import { getUserFullName, getUserInitials } from './userUtils';
import { getUserPhotoSrc } from '@/lib/api';

export function LocataireTopbar({ setMobileNav, setShowProfile, activeLabel, user }: LocataireTopbarProps) {
  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const photoSrc = getUserPhotoSrc(user);

  return (
    <header className="topbar">
      <button className="menu-button" onClick={() => setMobileNav(true)}>
        <Menu size={21} />
      </button>
      <div className="breadcrumbs">
        <span>Espace locataire</span><ChevronRight size={15} /><strong>{activeLabel}</strong>
      </div>
      <div className="top-actions">
        <div className="notification-wrap">
          <button className="icon-button" aria-label="Notifications">
            <Bell size={19} /><i />
          </button>
        </div>
        <button className="top-user top-user-button icon-button" onClick={() => setShowProfile(true)}>
          {photoSrc ? (
            <img src={photoSrc} alt={fullName} className="user-initial" style={{ padding: 0, objectFit: 'cover' }} />
          ) : (
            <div className="user-initial blue">{initials}</div>
          )}
          <span>{fullName}</span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
