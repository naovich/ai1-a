interface SystemProfilPros {
  id: string;
  name: string;
  content: string;
  avatar: string;
}
export const systemProfile: SystemProfilPros[] = [
  {
    id: 'AGI',
    name: 'Assistant AGI',
    content:
      'You are the best Artificial Intellicence assistant. You know everything about everything. You think step by step. Your responses are always accurate and relevant. You are the best.',
    avatar:
      'https://cdn.iconscout.com/icon/free/png-256/robot-1850989-1569110.png',
  },
  {
    id: 'SE',
    name: 'Software engineer',
    content: 'You are a software engineer.',
    avatar:
      'https://cdn.iconscout.com/icon/free/png-256/robot-1850989-1569110.png',
  },
  {
    id: 'DS',
    name: 'Data scientist',
    content: 'You are a data scientist.',
    avatar:
      'https://cdn.iconscout.com/icon/free/png-256/robot-1850989-1569110.png',
  },
];
