import { MenuItem, MenuContent } from './types';

// Main menu items arranged in circle formation
export const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'emergency',
    title: 'Emergency',
    icon: 'AlertCircle',
    color: '#ff4757',
    borderColor: '#c0392b',
    angle: 0, // 12 o'clock
  },
  {
    id: 'learning',
    title: 'Learning',
    icon: 'GraduationCap',
    color: '#a55eea',
    borderColor: '#8854d0',
    angle: 45, // 1:30 position
  },
  {
    id: 'videos',
    title: 'Videos',
    icon: 'MonitorPlay',
    color: '#e74c3c',
    borderColor: '#c0392b',
    angle: 90, // 3 o'clock
  },
  {
    id: 'games',
    title: 'Games',
    icon: 'Gamepad2',
    color: '#45b7d1',
    borderColor: '#0984e3',
    angle: 135, // 4:30 position
  },
  {
    id: 'chat',
    title: 'Chat',
    icon: 'MessageCircleHeart',
    color: '#f9ca24',
    borderColor: '#e1b12c',
    angle: 180, // 6 o'clock
  },
  {
    id: 'rewards',
    title: 'Rewards',
    icon: 'Award',
    color: '#f368e0',
    borderColor: '#e84393',
    angle: 270, // 9 o'clock
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: 'Calendar',
    color: '#26de81',
    borderColor: '#20bf6b',
    angle: 225, // 7:30 position
  },
  {
    id: 'market',
    title: 'Market',
    icon: 'ShoppingBag',
    color: '#778ca3',
    borderColor: '#57606f',
    angle: 315, // 10:30 position
    // isSubmenu: true, // Commented out - no submenu for now
  },
];

// More submenu items
export const MORE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'onboarding',
    title: 'Onboarding',
    icon: 'Plane',
    color: '#95e1d3',
    borderColor: '#26a69a',
    angle: 0,
    isSubmenu: true,
  },
  {
    id: 'market',
    title: 'Market',
    icon: 'ShoppingBag',
    color: '#ff6b6b',
    borderColor: '#ee5a52',
    angle: 60,
    isSubmenu: true,
  },
  {
    id: 'learn',
    title: 'Learn',
    icon: 'GraduationCap',
    color: '#4ecdc4',
    borderColor: '#26a69a',
    angle: 120,
    isSubmenu: true,
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'DollarSign',
    color: '#45b7d1',
    borderColor: '#3498db',
    angle: 180,
    isSubmenu: true,
  },
  {
    id: 'media',
    title: 'Media',
    icon: 'PlayCircle',
    color: '#f9ca24',
    borderColor: '#f39c12',
    angle: 240,
    isSubmenu: true,
  },
  {
    id: 'apps',
    title: 'Apps',
    icon: 'Grid3x3',
    color: '#6c5ce7',
    borderColor: '#5f3dc4',
    angle: 300,
    isSubmenu: true,
  },
];

// Content data for each menu item
export const MENU_CONTENT: MenuContent = {
  emergency: [
    {
      icon: 'Phone',
      title: 'Call 911',
      description: 'Emergency services',
    },
    {
      icon: 'Heart',
      title: 'Urgent Care',
      description: 'Immediate medical attention',
    },
    {
      icon: 'AlertTriangle',
      title: 'Poison Control',
      description: '1-800-222-1222',
    },
    {
      icon: 'Stethoscope',
      title: 'Nurse Line',
      description: '24/7 medical advice',
    },
  ],
  videos: [
    {
      icon: 'MonitorPlay',
      title: 'New Videos',
      description: 'Latest Sesame Street content',
      youtubePlaylistId: 'PL8TioFHubWFsnPhBmrDQ8dtoXxghDMKxr',
      thumbnail: 'https://img.youtube.com/vi/LDP08F3op80/mqdefault.jpg',
    },
    {
      icon: 'Music',
      title: 'Songs',
      description: 'Sing along with Sesame Street',
      youtubeVideoId: 'LDP08F3op80',
      thumbnail: 'https://img.youtube.com/vi/LDP08F3op80/mqdefault.jpg',
    },
    {
      icon: 'MonitorPlay',
      title: 'Plaza Sésamo',
      description: 'Sesame Street en Español',
      youtubeVideoId: 'F6IIT9no7_I',
      thumbnail: 'https://img.youtube.com/vi/F6IIT9no7_I/mqdefault.jpg',
    },
  ],
  learning: {
    tabs: [
      {
        id: 'social-emotional',
        label: 'Social Emotional',
        items: [
          {
            icon: 'PlayCircle',
            title: 'Count Me In',
            description: 'G1-U1 Social Emotional Learning',
            videoId: 'ieyzenmkx9',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/e69a000ab5dec0beebd865b8c6a5792a11084677.jpg?image_crop_resized=960x540',
          },
          {
            icon: 'PlayCircle',
            title: 'My Body My Brain',
            description: 'G1-U1 Social Emotional Learning',
            videoId: '8bbw9rk484',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/18cac187d5181daef08b029dca1ad7640fdc9cdc.jpg?image_crop_resized=960x540',
          },
          {
            icon: 'PlayCircle',
            title: 'Raise Your Hand',
            description: 'G1-U1 Social Emotional Learning',
            videoId: '7fo0gtroy3',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/7a513c123f06975016c2f8f37d5cd4afb4db094d.jpg?image_crop_resized=960x540',
          },
          {
            icon: 'PlayCircle',
            title: 'What Do You Like to Do',
            description: 'G1-U1 Social Emotional Learning',
            videoId: 'qobb6e37af',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/8eb637bfb64873c03206d3705d8bd0ec626078a6.jpg?image_crop_resized=960x540',
          },
        ],
      },
      {
        id: 'english',
        label: 'English',
        items: [
          {
            icon: 'PlayCircle',
            title: 'Sunny Day',
            description: 'Educational content',
            videoId: 'db1gg8uttq',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/358950907ded006a78fdd2eb9270f7f591c75aa7.jpg?image_crop_resized=960x540',
          },
          {
            icon: 'PlayCircle',
            title: 'Letter of the Day',
            description: 'Learning letters with friends',
            videoId: 'zlysy8w3hj',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/0e710e0c2894919b0f99c872addf96e065584c46.jpg?image_crop_resized=960x540',
          },
          {
            icon: 'PlayCircle',
            title: 'Dinosaurs - Elmo\'s World',
            description: 'Learn about dinosaurs',
            videoId: '25hcausk6n',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/b8848a693dd12311533b49f81890fed4adbc01b4.jpg?image_crop_resized=640x360',
          },
          {
            icon: 'PlayCircle',
            title: 'Verbs - The Yip Yips',
            description: 'Learning action words',
            videoId: 'zqtrw5c0ft',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/b02e79d591cd470d164f9a170e05dd026986f155.jpg?image_crop_resized=640x360',
          },
          {
            icon: 'PlayCircle',
            title: 'Mystery Word',
            description: 'Word discovery game',
            videoId: '6jwhzsz4vw',
            thumbnail: 'https://embed-ssl.wistia.com/deliveries/a7decce16a3307c9a3bc11de2b08b296a1bbad08.jpg?image_crop_resized=960x540',
          },
        ],
      },
      {
        id: 'training',
        label: 'Training',
        items: [
          // Training videos coming soon
        ],
      },
    ],
  },
  calendar: [
    // Mexico 2026 Public Holidays (Spring Semester)
    {
      icon: 'Calendar',
      title: 'Año Nuevo',
      description: 'New Year\'s Day - National Holiday',
      time: 'Jue, Ene 1, 2026',
      date: '2026-01-01',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Día de la Constitución',
      description: 'Constitution Day - National Holiday',
      time: 'Lun, Feb 2, 2026',
      date: '2026-02-02',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Natalicio de Benito Juárez',
      description: 'Benito Juárez Birthday - National Holiday',
      time: 'Lun, Mar 16, 2026',
      date: '2026-03-16',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Semana Santa',
      description: 'Holy Week - School Break',
      time: 'Mar 30 - Abr 12, 2026',
      date: '2026-03-30',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Día del Trabajo',
      description: 'Labor Day - National Holiday',
      time: 'Vie, May 1, 2026',
      date: '2026-05-01',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Día del Niño',
      description: 'Children\'s Day - School Celebration',
      time: 'Jue, Abr 30, 2026',
      date: '2026-04-30',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Día de las Madres',
      description: 'Mother\'s Day - Family Celebration',
      time: 'Dom, May 10, 2026',
      date: '2026-05-10',
      isFree: true,
    },
    {
      icon: 'Calendar',
      title: 'Día del Maestro',
      description: 'Teacher\'s Day - School Celebration',
      time: 'Mar, May 15, 2026',
      date: '2026-05-15',
      isFree: true,
    },
  ],
  chat: [
    {
      icon: 'AudioLines',
      title: 'Voice Chat',
      description: 'Talk with AI assistant',
    },
  ],
  rewards: [
    {
      icon: 'Award',
      title: 'Coming Soon',
      description: 'Rewards and garden features coming',
    },
  ],
  games: [
    {
      icon: 'Gamepad2',
      title: 'Sesame Street Games',
      description: 'Play fun games with your favorite characters',
      gameUrl: 'https://www.sesamestreet.org/games',
      thumbnail: '/thumb/game.jpg',
    },
    {
      icon: 'PlayCircle',
      title: 'More Games Coming',
      description: 'Add more games here',
    },
  ],
  market: [
    {
      icon: 'ShoppingBag',
      title: 'Coming Soon',
      description: 'Marketplace features coming',
    },
  ],
  // More submenu items - COMMENTED OUT
  onboarding: [
    {
      icon: 'User',
      title: 'Welcome Tour',
      description: 'Take a guided tour',
    },
    {
      icon: 'BookOpen',
      title: 'Getting Started',
      description: 'Basic setup guide',
    },
    {
      icon: 'Users',
      title: 'Connect Neighbors',
      description: 'Find your community',
    },
    {
      icon: 'Shield',
      title: 'Safety Tips',
      description: 'Stay safe online',
    },
  ],
  learn: [
    {
      icon: 'GraduationCap',
      title: 'Coming Soon',
      description: 'Learning resources',
    },
  ],
  finance: [
    {
      icon: 'DollarSign',
      title: 'Coming Soon',
      description: 'Financial tools',
    },
  ],
  media: [
    {
      icon: 'PlayCircle',
      title: 'Coming Soon',
      description: 'Media library',
    },
  ],
  apps: [
    {
      icon: 'Grid3x3',
      title: 'Coming Soon',
      description: 'Third-party apps',
    },
  ],
};

// Animation constants
export const ANIMATION_DURATION = 0.3;
export const STAGGER_DELAY = 0.05;
export const MENU_RADIUS = 140; // Menu buttons positioned at 280px diameter circle
export const CENTER_BUTTON_SIZE = 100; // Base size - CSS will handle responsiveness
export const MENU_BUTTON_SIZE = 75; // Larger menu buttons (75px diameter)