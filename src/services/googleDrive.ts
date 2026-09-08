export interface GoogleDriveUser {
  name: string;
  email: string;
  picture?: string;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

let currentUser: GoogleDriveUser | null = null;
let currentToken: string | null = null;
type AuthListener = {
  onConnected: (user: GoogleDriveUser, token: string) => void;
  onDisconnected?: () => void;
};
let authListeners: AuthListener[] = [];

export const initGoogleAuth = (
  onConnected: (user: GoogleDriveUser, token: string) => void,
  onDisconnected?: () => void
): (() => void) => {
  const listener: AuthListener = { onConnected, onDisconnected };
  authListeners.push(listener);

  if (currentUser && currentToken) {
    onConnected(currentUser, currentToken);
  } else if (onDisconnected) {
    onDisconnected();
  }

  return () => {
    authListeners = authListeners.filter((l) => l !== listener);
  };
};

export const getDriveAccessToken = (): string | null => {
  return currentToken;
};

export const signInWithGoogleDrive = async (): Promise<{ user: GoogleDriveUser }> => {
  const mockUser: GoogleDriveUser = {
    name: 'Via (Owner)',
    email: 'agenberasgendis@gmail.com',
    picture: '',
  };
  currentUser = mockUser;
  currentToken = 'mock-google-token-' + Date.now();
  authListeners.forEach((l) => l.onConnected(mockUser, currentToken!));
  return { user: mockUser };
};

export const signOutGoogleDrive = async (): Promise<void> => {
  currentUser = null;
  currentToken = null;
  authListeners.forEach((l) => l.onDisconnected && l.onDisconnected());
};

export const uploadBackupToDrive = async (
  _token: string,
  data: any,
  _description?: string
): Promise<{ success: boolean; fileName: string; fileId?: string }> => {
  const key = 'backup_drive_files';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const fileName = `backup_gendis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const rawData = typeof data === 'string' ? data : JSON.stringify(data);

  const newFile = {
    id: 'drive-' + Date.now(),
    name: fileName,
    createdTime: new Date().toISOString(),
    size: `${Math.round(rawData.length / 1024)} KB`,
    data: rawData,
  };
  existing.unshift(newFile);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));

  return {
    success: true,
    fileName,
    fileId: newFile.id,
  };
};

export const listBackupsFromDrive = async (_token?: string): Promise<DriveBackupFile[]> => {
  try {
    const key = 'backup_drive_files';
    const existing: Array<DriveBackupFile & { data?: string }> = JSON.parse(
      localStorage.getItem(key) || '[]'
    );
    return existing.map(({ id, name, createdTime, size }) => ({ id, name, createdTime, size }));
  } catch {
    return [];
  }
};

export const downloadBackupFromDrive = async (
  _token: string,
  fileId: string
): Promise<any> => {
  const key = 'backup_drive_files';
  const existing: Array<DriveBackupFile & { data?: string }> = JSON.parse(
    localStorage.getItem(key) || '[]'
  );
  const found = existing.find((f) => f.id === fileId);
  return found?.data || null;
};
