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
    id: 'activities',
    title: 'Activities',
    icon: 'Calendar',
    color: '#26de81',
    borderColor: '#20bf6b',
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
    id: 'schedule',
    title: 'Schedule',
    icon: 'Clock',
    color: '#f368e0',
    borderColor: '#e84393',
    angle: 225, // 7:30 position
  },
  {
    id: 'games',
    title: 'Games',
    icon: 'Gamepad2',
    color: '#45b7d1',
    borderColor: '#0984e3',
    angle: 270, // 9 o'clock
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
      youtubePlaylistId: 'PL1vMhg3AawgTYlcjJG9MTiMLNMHSAIxEQ',
      thumbnail: 'https://img.youtube.com/vi/9gFT0bSLNEA/mqdefault.jpg',
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
  activities: [
    {
      icon: 'Palette',
      title: 'Art',
      description: 'Creative activities',
      time: 'Today 3PM',
    },
    {
      icon: 'Trees',
      title: 'Park',
      description: 'Outdoor play',
      time: 'Sat 10AM',
    },
    {
      icon: 'Book',
      title: 'Story',
      description: 'Story time',
      time: 'Wed 11AM',
    },
    {
      icon: 'Music',
      title: 'Music',
      description: 'Music class',
      time: 'Fri 2PM',
    },
  ],
  chat: [
    {
      icon: 'AudioLines',
      title: 'Voice Chat',
      description: 'Talk with AI assistant',
    },
  ],
  schedule: [
    {
      icon: 'GraduationCap',
      title: '9AM School',
      description: 'Drop-off at Elementary',
      time: '9:00 AM',
    },
    {
      icon: 'Stethoscope',
      title: '2PM Doctor',
      description: 'Pediatrician appointment',
      time: '2:00 PM',
    },
    {
      icon: 'Zap',
      title: '3:30PM Soccer',
      description: 'Practice at field #2',
      time: '3:30 PM',
    },
    {
      icon: 'UtensilsCrossed',
      title: '6PM Dinner',
      description: 'Family dinner time',
      time: '6:00 PM',
    },
  ],
  games: [
    {
      icon: 'PlayCircle',
      title: 'Mecha Builders',
      description: 'Build and create',
    },
    {
      icon: 'Grid3x3',
      title: 'Matching',
      description: 'Match pairs',
    },
    {
      icon: 'Zap',
      title: 'Memory',
      description: 'Test your memory',
    },
    {
      icon: 'Plus',
      title: 'Coming Soon',
      description: 'More games on the way',
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