import type { Postgres } from "../dist";

export type Course = Postgres.Table<
  "courses",
  {
    id:
      | number
      | ({ identity: "generate always"; collated: "" } | "primary key");
    name: string;
  }
>;

export type User = Postgres.Table<
  "users",
  {
    email: string & { default: "hi" };
  }
>;

export type CourseAccess = Postgres.Table<
  "course_access",
  {
    role: "student" | "administrator" | "owner";
    user: User;
    course: Course;
  }
>;
