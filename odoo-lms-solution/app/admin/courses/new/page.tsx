import { CourseForm } from "@/components/course-form";

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <CourseForm mode="create" />
    </div>
  );
}
