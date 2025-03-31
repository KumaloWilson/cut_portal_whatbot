import type { Announcement } from "../models/announcement.model"

// Mock announcements
const announcements: Announcement[] = [
  {
    id: "1",
    title: "Registration Deadline",
    content: "Course registration for the Fall semester closes on August 15th.",
    date: new Date("2024-08-01"),
    important: true,
  },
  {
    id: "2",
    title: "Campus Maintenance",
    content: "The library will be closed for maintenance from July 10-15.",
    date: new Date("2024-07-05"),
    important: false,
  },
  {
    id: "3",
    title: "Scholarship Applications",
    content: "Scholarship applications for the next academic year are now open.",
    date: new Date("2024-06-20"),
    important: true,
  },
]

export class AnnouncementService {
  async getAnnouncements(limit = 5): Promise<Announcement[]> {
    // Sort by date (newest first) and importance
    return [...announcements]
      .sort((a, b) => {
        if (a.important !== b.important) {
          return a.important ? -1 : 1
        }
        return b.date.getTime() - a.date.getTime()
      })
      .slice(0, limit)
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const announcement = announcements.find((a) => a.id === id)
    return announcement || null
  }
}

