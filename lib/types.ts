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
  youtubePlaylistId?: string;  // For YouTube playlist embeds
  youtubeVideoId?: string;     // For individual YouTube videos
}

// For menus with tabs/categories (like Learning)
export interface TabbedContent {
  tabs: {
    id: string;
    label: string;
    items: ContentItem[];
  }[];
}

export interface MenuContent {
  [key: string]: ContentItem[] | TabbedContent;
}

// Helper to check if content is tabbed
export function isTabbedContent(content: ContentItem[] | TabbedContent): content is TabbedContent {
  return (content as TabbedContent).tabs !== undefined;
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