import Notification from '@/lib/models/Notification';

export async function sendNotification({ userId, role, title, text, type, link }) {
  await Notification.create({
    user_id: userId,
    role,
    title,
    text,
    type,
    link,
    read: false,
    createdAt: new Date()
  });
} 