import {
  User,
  Users,
  Briefcase,
  Globe2,
  Network,
  Fingerprint,
  Mail,
  Phone,
  Server,
  MapPin,
  FileText,
  Calendar,
  Boxes,
} from 'lucide-react';
import { EntityType, ENTITY_TYPES } from '@/types';

interface EntityIconProps {
  type: EntityType | string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const EntityIcon: React.FC<EntityIconProps> = ({
  type,
  className = 'w-4 h-4',
  size,
  strokeWidth = 1.5,
}) => {
  switch (type) {
    case 'person':
      return <User className={className} size={size} strokeWidth={strokeWidth} />;
    case 'organization':
      return <Users className={className} size={size} strokeWidth={strokeWidth} />;
    case 'company':
      return <Briefcase className={className} size={size} strokeWidth={strokeWidth} />;
    case 'website':
      return <Globe2 className={className} size={size} strokeWidth={strokeWidth} />;
    case 'domain':
      return <Network className={className} size={size} strokeWidth={strokeWidth} />;
    case 'account':
      return <Fingerprint className={className} size={size} strokeWidth={strokeWidth} />;
    case 'email':
      return <Mail className={className} size={size} strokeWidth={strokeWidth} />;
    case 'phone':
      return <Phone className={className} size={size} strokeWidth={strokeWidth} />;
    case 'ip':
      return <Server className={className} size={size} strokeWidth={strokeWidth} />;
    case 'location':
      return <MapPin className={className} size={size} strokeWidth={strokeWidth} />;
    case 'document':
      return <FileText className={className} size={size} strokeWidth={strokeWidth} />;
    case 'event':
      return <Calendar className={className} size={size} strokeWidth={strokeWidth} />;
    case 'custom':
    default:
      return <Boxes className={className} size={size} strokeWidth={strokeWidth} />;
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
