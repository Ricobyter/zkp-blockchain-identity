import { useState } from "react";
import toast from "react-hot-toast";

import UploadPanel from "../components/UploadPanel.jsx";
import api, { getApiErrorMessage } from "../services/api.js";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/students/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(response.data.message || "Upload completed successfully");
      setFile(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="panel">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Upload students</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Bulk import from Excel</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Upload a workbook with the required headers. Each row will be validated, hashed with Poseidon, and inserted into MongoDB.
          Emails are not sent during upload.
        </p>
      </div>

      <UploadPanel file={file} onFileChange={handleFileChange} onSubmit={handleSubmit} loading={loading} />
    </section>
  );
}