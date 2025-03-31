import type { User } from "../models/user.model"

// In a production environment, this would be replaced with a database connection
const users: User[] = [
  {
    id: "1",
    studentId: "CUT001",
    name: "John Doe",
    email: "john.doe@cut.edu",
    program: "Computer Science",
    year: 3,
  },
  {
    id: "2",
    studentId: "CUT002",
    name: "Jane Smith",
    email: "jane.smith@cut.edu",
    program: "Engineering",
    year: 2,
  },
]

export class UserService {
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    // In production, this would query a database to find the user associated with this phone number
    // For demo purposes, we'll just return the first user
    return users[0]
  }

  async getUserById(id: string): Promise<User | null> {
    const user = users.find((u) => u.id === id)
    return user || null
  }

  async getUserByStudentId(studentId: string): Promise<User | null> {
    const user = users.find((u) => u.studentId === studentId)
    return user || null
  }
}

