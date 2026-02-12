import { db } from "../firebase";
import { doc, writeBatch } from "firebase/firestore";
import localCoursesData from "../data/courses.json";

export const uploadCoursesToFirestore = async () => {
  try {
    const courses = localCoursesData.courses; // Access the array
    if (!courses || courses.length === 0) {
      console.log("No courses to upload.");
      return;
    }

    const batch = writeBatch(db);
    let count = 0;

    courses.forEach((course) => {
      // Use course code as document ID (e.g., "CSC448")
      // Remove spaces for ID safety: "CSC 448" -> "CSC448"
      const docId = course.code.replace(/\s+/g, "").toUpperCase();
      const courseRef = doc(db, "courses", docId);
      
      batch.set(courseRef, course);
      count++;
    });

    await batch.commit();
    console.log(`Successfully uploaded ${count} courses to Firestore!`);
  } catch (error) {
    console.error("Error uploading courses:", error);
    alert("Error uploading courses. Check console.");
  }
};
