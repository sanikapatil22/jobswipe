// System design interview questions + resources, sourced from:
// - https://github.com/liquidslr/system-design-notes (full chapter notes with diagrams)
// - https://pagefy.io/system-design/system-design-interview-by-alex-xu (question list)
// Each question maps to a notes chapter that walks through the design end-to-end.

export interface SystemDesignQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // Tags shown as chips in the UI.
  tags: string[];
  // Deep link into the notes repo for this chapter.
  notesUrl: string;
  notesLabel: string;
}

const NOTES_ROOT = 'https://github.com/liquidslr/system-design-notes/tree/main';

export const SYSTEM_DESIGN_QUESTIONS: SystemDesignQuestion[] = [
  { id: 'rate-limiter', title: 'Design a Rate Limiter', difficulty: 'Medium', tags: ['Classic', 'API'], notesUrl: `${NOTES_ROOT}/04.%20Rate%20Limiter`, notesLabel: 'Rate Limiter notes' },
  { id: 'consistent-hashing', title: 'Design Consistent Hashing', difficulty: 'Medium', tags: ['Foundational'], notesUrl: `${NOTES_ROOT}/05.%20Consistent%20Hashing`, notesLabel: 'Consistent Hashing notes' },
  { id: 'key-value-store', title: 'Design a Key-Value Store', difficulty: 'Medium', tags: ['Storage'], notesUrl: `${NOTES_ROOT}/06.%20Key-Value%20Store`, notesLabel: 'Key-Value Store notes' },
  { id: 'unique-id', title: 'Design a Unique ID Generator', difficulty: 'Easy', tags: ['Classic'], notesUrl: `${NOTES_ROOT}/07.%20Unique-Id%20Generator`, notesLabel: 'Unique ID Generator notes' },
  { id: 'url-shortener', title: 'Design a URL Shortener', difficulty: 'Easy', tags: ['Classic', 'Must-know'], notesUrl: `${NOTES_ROOT}/08.%20URL%20Shortener`, notesLabel: 'URL Shortener notes' },
  { id: 'web-crawler', title: 'Design a Web Crawler', difficulty: 'Hard', tags: ['Scale'], notesUrl: `${NOTES_ROOT}/09.%20Web%20Crawler`, notesLabel: 'Web Crawler notes' },
  { id: 'notification', title: 'Design a Notification System', difficulty: 'Medium', tags: ['Classic'], notesUrl: `${NOTES_ROOT}/10.%20Notification%20System`, notesLabel: 'Notification System notes' },
  { id: 'news-feed', title: 'Design a News Feed System', difficulty: 'Medium', tags: ['Social', 'Must-know'], notesUrl: `${NOTES_ROOT}/11.%20News%20Feed%20System`, notesLabel: 'News Feed notes' },
  { id: 'chat', title: 'Design a Chat System', difficulty: 'Medium', tags: ['Real-time', 'Must-know'], notesUrl: `${NOTES_ROOT}/12.%20Chat%20System`, notesLabel: 'Chat System notes' },
  { id: 'search-autocomplete', title: 'Design a Search Autocomplete / Typeahead', difficulty: 'Medium', tags: ['Search'], notesUrl: `${NOTES_ROOT}/13.%20Search%20Autocomplete`, notesLabel: 'Search Autocomplete notes' },
  { id: 'video-streaming', title: 'Design a Video Streaming Platform (YouTube)', difficulty: 'Hard', tags: ['Media'], notesUrl: `${NOTES_ROOT}/14.%20Youtube`, notesLabel: 'YouTube notes' },
  { id: 'google-drive', title: 'Design Google Drive / Cloud File Storage', difficulty: 'Hard', tags: ['Storage', 'Sync'], notesUrl: `${NOTES_ROOT}/15.%20Google%20Drive`, notesLabel: 'Google Drive notes' },
  { id: 'proximity', title: 'Design a Proximity Service', difficulty: 'Medium', tags: ['Geo'], notesUrl: `${NOTES_ROOT}/16.%20Proximity%20Service`, notesLabel: 'Proximity Service notes' },
  { id: 'nearby-friends', title: 'Design Nearby Friends', difficulty: 'Medium', tags: ['Geo', 'Real-time'], notesUrl: `${NOTES_ROOT}/17.%20Nearby%20Friends`, notesLabel: 'Nearby Friends notes' },
  { id: 'google-maps', title: 'Design Google Maps', difficulty: 'Hard', tags: ['Geo', 'Scale'], notesUrl: `${NOTES_ROOT}/18.%20Google%20Maps`, notesLabel: 'Google Maps notes' },
  { id: 'message-queue', title: 'Design a Distributed Message Queue', difficulty: 'Hard', tags: ['Infra'], notesUrl: `${NOTES_ROOT}/19.%20Distributed%20Message%20Queue`, notesLabel: 'Message Queue notes' },
  { id: 'monitoring', title: 'Design a Metrics Monitoring & Alerting System', difficulty: 'Hard', tags: ['Infra', 'Observability'], notesUrl: `${NOTES_ROOT}/20.%20Metrics%20Monitoring%20and%20Alerting%20System`, notesLabel: 'Monitoring notes' },
  { id: 'ad-click', title: 'Design Ad Click Event Aggregation', difficulty: 'Medium', tags: ['Data'], notesUrl: `${NOTES_ROOT}/21.%20Ad%20Click%20Event%20Aggregation`, notesLabel: 'Ad Click Aggregation notes' },
  { id: 'hotel-reservation', title: 'Design a Hotel Reservation System', difficulty: 'Medium', tags: ['Booking'], notesUrl: `${NOTES_ROOT}/22.%20Hotel%20Reservation%20System`, notesLabel: 'Hotel Reservation notes' },
  { id: 'email', title: 'Design a Distributed Email Service', difficulty: 'Hard', tags: ['Communication'], notesUrl: `${NOTES_ROOT}/23.%20Distributed%20Email%20Service`, notesLabel: 'Email Service notes' },
  { id: 'object-storage', title: 'Design an S3-like Object Storage', difficulty: 'Hard', tags: ['Storage', 'Scale'], notesUrl: `${NOTES_ROOT}/24.%20S3-like%20Object%20Storage`, notesLabel: 'Object Storage notes' },
  { id: 'leaderboard', title: 'Design a Real-time Gaming Leaderboard', difficulty: 'Medium', tags: ['Gaming', 'Real-time'], notesUrl: `${NOTES_ROOT}/25.%20Real-time%20Gaming%20Leaderboard`, notesLabel: 'Leaderboard notes' },
  { id: 'payment', title: 'Design a Payment System', difficulty: 'Hard', tags: ['Fintech', 'Must-know'], notesUrl: `${NOTES_ROOT}/26.%20Payment%20System`, notesLabel: 'Payment System notes' },
  { id: 'digital-wallet', title: 'Design a Digital Wallet', difficulty: 'Medium', tags: ['Fintech'], notesUrl: `${NOTES_ROOT}/27.%20%20Digital%20Wallet`, notesLabel: 'Digital Wallet notes' },
  { id: 'stock-exchange', title: 'Design a Stock Exchange', difficulty: 'Hard', tags: ['Fintech', 'Real-time'], notesUrl: `${NOTES_ROOT}/28.%20Stock%20Exchange`, notesLabel: 'Stock Exchange notes' },
];

// Always-relevant primer chapters (scaling, estimation, framework).
export const SYSTEM_DESIGN_FUNDAMENTALS: SystemDesignQuestion[] = [
  { id: 'scaling', title: 'Scaling & Load Balancing Fundamentals', difficulty: 'Easy', tags: ['Primer'], notesUrl: `${NOTES_ROOT}/01.%20Scaling`, notesLabel: 'Scaling notes' },
  { id: 'back-of-envelope', title: 'Back-of-the-Envelope Estimation', difficulty: 'Easy', tags: ['Primer'], notesUrl: `${NOTES_ROOT}/02.%20Back%20Of%20the%20Envelope%20Estimation`, notesLabel: 'Estimation notes' },
  { id: 'framework', title: 'System Design Interview Framework', difficulty: 'Easy', tags: ['Primer', 'Must-know'], notesUrl: `${NOTES_ROOT}/03.%20System%20Design%20Framework`, notesLabel: 'Framework notes' },
];

export const SYSTEM_DESIGN_RESOURCES = [
  {
    title: 'System Design Interview — An Insider\u2019s Guide (Alex Xu)',
    url: 'https://pagefy.io/system-design/system-design-interview-by-alex-xu',
    description: 'The complete question list and approach behind every classic design problem.',
  },
  {
    title: 'system-design-notes (full repo)',
    url: 'https://github.com/liquidslr/system-design-notes',
    description: 'Chapter-by-chapter notes with architecture diagrams for all 28 designs.',
  },
  {
    title: 'Grokking System Design',
    url: 'https://www.designgurus.io/course/grokking-the-system-design-interview',
    description: 'Step-by-step framework for answering design questions in interviews.',
  },
];
