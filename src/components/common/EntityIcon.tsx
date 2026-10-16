import React from 'react';
import {
  User,
  Users,
  Building2,
  Globe,
  Network,
  AtSign,
  Mail,
  Phone,
  Server,
  MapPin,
  FileText,
  Calendar,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { EntityType, ENTITY_TYPES } from '@/types';

interface EntityIconProps {
  type: EntityType | string;
  className?: string;
  size?: number;
}

export const EntityIcon: React.FC<EntityIconProps> = ({ type, className = 'w-4 h-4', size }) => {
  switch (type) {
    case 'person':
      return <User className={className} size={size} />;
    case 'organization':
      return <Users className={className} size={size} />;
    case 'company':
      return <Building2 className={className} size={size} />;
    case 'website':
      return <Globe className={className} size={size} />;
    case 'domain':
      return <Network className={className} size={size} />;
    case 'account':
      return <AtSign className={className} size={size} />;
    case 'email':
      return <Mail className={className} size={size} />;
    case 'phone':
      return <Phone className={className} size={size} />;
    case 'ip':
      return <Server className={className} size={size} />;
    case 'location':
      return <MapPin className={className} size={size} />;
    case 'document':
      return <FileText className={className} size={size} />;
    case 'event':
      return <Calendar className={className} size={size} />;
    case 'custom':
    default:
      return <Tag className={className} size={size} />;
  }
};

export function getEntityTypeColor(type: EntityType | string): string {
  const found = ENTITY_TYPES.find((t) => t.type === type);
  return found ? found.color : '#e879f9';
}

export function getEntityTypeLabel(type: EntityType | string): string {
  const found = ENTITY_TYPES.find((t) => t.type === type);
  return found ? found.label : type;
}
