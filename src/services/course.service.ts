import type { Course } from "../models/course.model"
import type { Grade } from "../models/grade.model"

// Mock data for courses
const courses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Introduction to Programming",
    credits: 4,
  },
  {
    id: "2",
    code: "CS201",
    name: "Data Structures",
    credits: 4,
  },
  {
    id: "3",
    code: "CS301",
    name: "Database Systems",
    credits: 3,
  },
]

// Mock data for grades
const grades: Grade[] = [
  {
    studentId: "CUT001",
    courseId: "1",
    score: 85,
    semester: "Fall",
    year: 2023,
  },
  {
    studentId: "CUT001",
    courseId: "2",
    score: 78,
    semester: "Spring",
    year: 2024,
  },
  {
    studentId: "CUT002",
    courseId: "1",
    score: 92,
    semester: "Fall",
    year: 2023,
  },
]

export class CourseService {
  async getStudentCourses(studentId: string): Promise<Course[]> {
    // Get course IDs from grades for this student
    const studentGrades = grades.filter((g) => g.studentId === studentId)
    const courseIds = studentGrades.map((g) => g.courseId)

    // Get course details
    return courses.filter((course) => courseIds.includes(course.id))
  }

  async getStudentGrades(studentId: string): Promise<Array<Grade & { courseName: string }>> {
    const studentGrades = grades.filter((g) => g.studentId === studentId)

    return studentGrades.map((grade) => {
      const course = courses.find((c) => c.id === grade.courseId)
      return {
        ...grade,
        courseName: course ? course.name : "Unknown Course",
      }
    })
  }
}

