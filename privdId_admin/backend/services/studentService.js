import AppError from "../utils/appError.js";
import Student from "../models/Student.js";
import { hashPoseidonFields } from "../utils/poseidonHash.js";
import { generateTemporaryPassword } from "../utils/password.js";
import { sendCredentialsEmail } from "./emailService.js";
import { issueCredentialOnChain, revokeCredentialOnChain } from "./credentialService.js";

export function normalizeStudentInput(studentPayload) {
  return {
    name: String(studentPayload.name ?? "").trim(),
    email: String(studentPayload.email ?? "").trim().toLowerCase(),
    rollNo: String(studentPayload.rollNo ?? "").trim(),
    programme: String(studentPayload.programme ?? "").trim(),
    contactNo: String(studentPayload.contactNo ?? "").trim(),
  };
}

export function sanitizeStudent(student) {
  return {
    id: student._id.toString(),
    name: student.name,
    email: student.email,
    rollNo: student.rollNo,
    programme: student.programme,
    contactNo: student.contactNo,
    hashedData: student.hashedData,
    emailSent: student.emailSent,
    emailSentAt: student.emailSentAt,
    createdAt: student.createdAt,
    ipfsCID: student.ipfsCID ?? null,
    onChainTxHash: student.onChainTxHash ?? null,
    onChainBlock: student.onChainBlock ?? null,
    revoked: student.revoked ?? false,
    revokedAt: student.revokedAt ?? null,
  };
}

export async function listStudents() {
  const students = await Student.find().sort({ createdAt: -1 });
  return students.map(sanitizeStudent);
}

export async function findDuplicateStudent({ email, rollNo }) {
  return Student.findOne({
    $or: [{ email }, { rollNo }],
  });
}

export async function buildStudentRecord(studentPayload) {
  const normalizedStudent = normalizeStudentInput(studentPayload);
  const temporaryPassword = generateTemporaryPassword();
  const hashedData = await hashPoseidonFields([
    normalizedStudent.name,
    normalizedStudent.email,
    normalizedStudent.rollNo,
    normalizedStudent.programme,
    normalizedStudent.contactNo,
  ]);

  return {
    ...normalizedStudent,
    hashedData,
    password: temporaryPassword,
  };
}

export async function createStudent(studentPayload) {
  const record = await buildStudentRecord(studentPayload);
  const student = await Student.create({
    name: record.name,
    email: record.email,
    rollNo: record.rollNo,
    programme: record.programme,
    contactNo: record.contactNo,
    hashedData: record.hashedData,
    password: record.password,
    emailSent: false,
    emailSentAt: null,
  });

  // Anchor credential on IPFS + Sepolia — non-blocking, student is saved regardless
  try {
    const { cid, txHash, blockNumber } = await issueCredentialOnChain({
      rollNo: student.rollNo,
      programme: student.programme,
      email: student.email,
      hashedData: student.hashedData,
    });
    student.ipfsCID = cid;
    student.onChainTxHash = txHash;
    student.onChainBlock = blockNumber;
    await student.save();
  } catch (err) {
    console.error('[credential] On-chain anchoring failed for', student.rollNo, ':', err.message);
  }

  return {
    student: sanitizeStudent(student),
  };
}

export async function buildBulkStudents(studentRows) {
  const prepared = [];

  for (const row of studentRows) {
    const record = await buildStudentRecord(row);
    prepared.push(record);
  }

  return prepared;
}

export async function insertBulkStudents(preparedStudents) {
  const studentsToInsert = preparedStudents.map((student) => ({
    ...student,
    emailSent: false,
    emailSentAt: null,
  }));
  const insertedStudents = await Student.insertMany(studentsToInsert, { ordered: true });

  // Anchor each credential on IPFS + Sepolia — failures are logged but don't abort
  for (const student of insertedStudents) {
    try {
      const { cid, txHash, blockNumber } = await issueCredentialOnChain({
        rollNo: student.rollNo,
        programme: student.programme,
        email: student.email,
        hashedData: student.hashedData,
      });
      await Student.updateOne(
        { _id: student._id },
        { ipfsCID: cid, onChainTxHash: txHash, onChainBlock: blockNumber }
      );
    } catch (err) {
      console.error('[credential] On-chain anchoring failed for', student.rollNo, ':', err.message);
    }
  }

  const finalStudents = await Student.find({ _id: { $in: insertedStudents.map((s) => s._id) } });
  return {
    insertedStudents: finalStudents.map(sanitizeStudent),
  };
}

export async function updateStudent(id, payload) {
  const student = await Student.findById(id);
  if (!student) throw new AppError("Student not found.", 404);
  if (student.revoked) throw new AppError("Cannot update a revoked credential.", 400);

  const allowedFields = ["name", "programme", "contactNo"];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) student[field] = String(payload[field]).trim();
  });

  // Recompute Poseidon hash with updated fields
  student.hashedData = await hashPoseidonFields([
    student.name,
    student.email,
    student.rollNo,
    student.programme,
    student.contactNo,
  ]);

  await student.save();

  // Re-issue credential — new IPFS pin + overwrites on-chain CID for this rollNo
  try {
    const { cid, txHash, blockNumber } = await issueCredentialOnChain({
      rollNo: student.rollNo,
      programme: student.programme,
      email: student.email,
      hashedData: student.hashedData,
    });
    student.ipfsCID = cid;
    student.onChainTxHash = txHash;
    student.onChainBlock = blockNumber;
    await student.save();
  } catch (err) {
    console.error("[credential] Re-anchoring failed for", student.rollNo, ":", err.message);
  }

  return { student: sanitizeStudent(student) };
}

export async function revokeStudent(id) {
  const student = await Student.findById(id);
  if (!student) throw new AppError("Student not found.", 404);
  if (student.revoked) throw new AppError("Student credential already revoked.", 400);

  // Revoke on blockchain first
  try {
    await revokeCredentialOnChain(student.rollNo);
  } catch (err) {
    console.error("[credential] On-chain revocation failed for", student.rollNo, ":", err.message);
    throw new AppError("On-chain revocation failed: " + err.message, 500);
  }

  student.revoked = true;
  student.revokedAt = new Date();
  await student.save();

  return { student: sanitizeStudent(student) };
}

export async function sendEmailsForStudents(studentIds) {
  if (!Array.isArray(studentIds) || !studentIds.length) {
    throw new AppError("At least one student must be selected.", 400);
  }

  const students = await Student.find({ _id: { $in: studentIds } }).sort({ createdAt: -1 });

  if (!students.length) {
    throw new AppError("No matching students were found.", 404);
  }

  const results = await Promise.all(
    students.map(async (student) => {
      const studentId = student._id.toString();

      if (student.emailSent) {
        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "skipped",
          message: "Email already sent.",
        };
      }

      try {
        await sendCredentialsEmail({
          to: student.email,
          name: student.name,
          email: student.email,
          password: student.password,
        });

        student.emailSent = true;
        student.emailSentAt = new Date();
        await student.save();

        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "sent",
          message: "Credentials sent successfully.",
        };
      } catch (error) {
        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "failed",
          message: error.message || "Email delivery failed.",
        };
      }
    })
  );

  const summary = {
    sent: [],
    skipped: [],
    failed: [],
  };

  for (const result of results) {
    if (result.status === "sent") {
      summary.sent.push(result.studentId);
      continue;
    }

    if (result.status === "skipped") {
      summary.skipped.push({ studentId: result.studentId, reason: result.message });
      continue;
    }

    summary.failed.push({ studentId: result.studentId, reason: result.message });
  }

  return {
    summary,
    details: results,
  };
}