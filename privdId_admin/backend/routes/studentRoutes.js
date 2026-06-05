import express from "express";

import { addStudent, bulkAddStudents, getStudents, loginStudent, sendStudentEmails, updateStudentById, revokeStudentById, uploadMiddleware, uploadStudents } from "../controllers/studentController.js";

const router = express.Router();

router.post("/login", loginStudent);
router.get("/", getStudents);
router.post("/", addStudent);
router.post("/bulk", bulkAddStudents);
router.post("/upload", uploadMiddleware, uploadStudents);
router.post("/send-email", sendStudentEmails);
router.put("/:id", updateStudentById);
router.delete("/:id", revokeStudentById);

export default router;