export default function StudentForm({ formData, onChange, onSubmit, loading, submitLabel }) {
  return (
    <form className="panel grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Full name
          </label>
          <input className="field-input" id="name" name="name" value={formData.name} onChange={onChange} placeholder="Aarav Sharma" />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input className="field-input" id="email" name="email" type="email" value={formData.email} onChange={onChange} placeholder="student@college.edu" />
        </div>
        <div>
          <label className="field-label" htmlFor="rollNo">
            Roll number
          </label>
          <input className="field-input" id="rollNo" name="rollNo" value={formData.rollNo} onChange={onChange} placeholder="CS-2026-014" />
        </div>
        <div>
          <label className="field-label" htmlFor="programme">
            Programme
          </label>
          <input className="field-input" id="programme" name="programme" value={formData.programme} onChange={onChange} placeholder="B.Tech Computer Science" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="contactNo">
          Contact number
        </label>
        <input className="field-input" id="contactNo" name="contactNo" value={formData.contactNo} onChange={onChange} placeholder="9876543210" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </button>
        <p className="text-sm text-slate-400">A temporary password will be generated and sent by email.</p>
      </div>
    </form>
  );
}