export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  borderColor: string;
  angle: number;
  isSubmenu?: boolean;
}

export interface ContentItem {
  icon: string;
  title: string;
  description: string;
  time?: string;
  videoId?: string;
  thumbnail?: string;
}

export interface MenuContent {
  [key: string]: ContentItem[];
}

export interface MenuWheelProps {
  isOpen: boolean;
  onMenuClick: (menuId: string) => void;
  selectedMenu?: string;
}

export interface NavigationWheelProps {
  isMenuOpen: boolean;
  onToggle: () => void;
}

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContentItem[];
}

export type MenuState = 'closed' | 'main' | 'more';