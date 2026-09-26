import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Students() {
  const getUserRole = () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return null;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));

      return payload.role || null;
    } catch {
      return null;
    }
  };

  const role = getUserRole();
  const isAdmin = role === "Admin";

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    course: "",
    year: "",
    room_number: "",
    guardian_phone: "",
    parent_name: "",
    parent_email: "",
    emergency_contact: "",
    address: "",
    room_preference: "",
    admission_status: "Pending",
    admission_date: "",
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const getApiErrorMessage = (
    err,
    defaultMessage
  ) => {
    if (!err.response) {
      return "Unable to connect to the backend.";
    }

    const detail = err.response.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const location = Array.isArray(item.loc)
            ? item.loc[item.loc.length - 1]
            : "field";

          return `${location}: ${
            item.msg || "Invalid input"
          }`;
        })
        .join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return defaultMessage;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/students/"
      );

      setStudents(response.data);
    } catch (err) {
      console.error(
        "Failed to load students:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load students."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);

    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      course: student.course || "",
      year: student.year || "",
      room_number: student.room_number || "",
      guardian_phone:
        student.guardian_phone || "",
      parent_name:
        student.parent_name || "",
      parent_email:
        student.parent_email || "",
      emergency_contact:
        student.emergency_contact || "",
      address:
        student.address || "",
      room_preference:
        student.room_preference || "",
      admission_status:
        student.admission_status || "Pending",
      admission_date:
        student.admission_date || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        course: formData.course.trim(),
        year: Number(formData.year),

        room_number:
          formData.room_number.trim() ||
          null,

        guardian_phone:
          formData.guardian_phone.trim() ||
          null,

        parent_name:
          formData.parent_name.trim() ||
          null,

        parent_email:
          formData.parent_email.trim() ||
          null,

        emergency_contact:
          formData.emergency_contact.trim() ||
          null,

        address:
          formData.address.trim() || null,

        room_preference:
          formData.room_preference || null,

        admission_status:
          formData.admission_status,

        admission_date:
          formData.admission_date || null,

        user_id: editingStudent?.user_id
          ? Number(editingStudent.user_id)
          : null,
      };

      if (editingStudent) {
        await api.put(
          `/students/${editingStudent.id}`,
          payload
        );
      } else {
        await api.post(
          "/students/",
          payload
        );
      }

      await fetchStudents();
      closeForm();
    } catch (err) {
      console.error(
        "Failed to save student:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save student."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/students/${student.id}`
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Failed to delete student:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete student."
        )
      );
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(
      `${dateValue}T00:00:00`
    ).toLocaleDateString("en-GB");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              {isAdmin
                ? "ADMINISTRATION"
                : "WARDEN PORTAL"}
            </span>

            <h1>
              {isAdmin
                ? "Student Admissions"
                : "Students"}
            </h1>

            <p>
              {isAdmin
                ? "Manage hostel admissions, student details, parent contacts, and account links."
                : "View and manage admitted hostel students."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>TOTAL STUDENTS</span>
            <strong>
              {students.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="students-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card students-management-card">
          <div className="overview-header">
            <div>
              <h2>
                Student Records
              </h2>

              <p>
                Admission and hostel student
                information.
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  showForm
                    ? closeForm
                    : openAddForm
                }
              >
                {showForm
                  ? "Close Form"
                  : "+ New Admission"}
              </button>
            )}
          </div>

          {showForm && (
            <form
              className="student-form"
              onSubmit={handleSubmit}
            >
              <div className="student-form-title">
                <div>
                  <h3>
                    {editingStudent
                      ? "Edit Student Details"
                      : "New Student Admission"}
                  </h3>

                  <p>
                    {editingStudent
                      ? "Update the student's admission and contact information."
                      : "Enter the student's admission details. A HostelHub Student ID will be generated automatically."}
                  </p>
                </div>
              </div>

              <div className="student-form-grid">
                {editingStudent && (
                  <div className="form-group">
                    <label>
                      HostelHub Student ID
                    </label>

                    <input
                      type="text"
                      value={
                        editingStudent.student_code ||
                        ""
                      }
                      disabled
                    />

                    <small className="form-help">
                      Student ID cannot be
                      changed.
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="name">
                    Student Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Student Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Student Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="course">
                    Course
                  </label>

                  <input
                    id="course"
                    name="course"
                    type="text"
                    placeholder="Example: CSE"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year">
                    Academic Year
                  </label>

                  <input
                    id="year"
                    name="year"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="Example: 2"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admission_date">
                    Admission Date
                  </label>

                  <input
                    id="admission_date"
                    name="admission_date"
                    type="date"
                    value={
                      formData.admission_date
                    }
                    onChange={handleChange}
                  />

                  <small className="form-help">
                    If empty during new
                    admission, today's date
                    will be used.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="admission_status">
                    Admission Status
                  </label>

                  <select
                    id="admission_status"
                    name="admission_status"
                    value={
                      formData.admission_status
                    }
                    onChange={handleChange}
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Approved">
                      Approved
                    </option>

                    <option value="Admitted">
                      Admitted
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="room_preference">
                    Room Preference
                  </label>

                  <select
                    id="room_preference"
                    name="room_preference"
                    value={
                      formData.room_preference
                    }
                    onChange={handleChange}
                  >
                    <option value="">
                      Select preference
                    </option>

                    <option value="1-Sharing">
                      1-Sharing
                    </option>

                    <option value="2-Sharing">
                      2-Sharing
                    </option>

                    <option value="3-Sharing">
                      3-Sharing
                    </option>

                    <option value="4-Sharing">
                      4-Sharing
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="room_number">
                    Allocated Room
                  </label>

                  <input
                    id="room_number"
                    name="room_number"
                    type="text"
                    placeholder="Leave empty before allocation"
                    value={
                      formData.room_number
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="parent_name">
                    Parent / Guardian Name
                  </label>

                  <input
                    id="parent_name"
                    name="parent_name"
                    type="text"
                    placeholder="Enter parent name"
                    value={
                      formData.parent_name
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="guardian_phone">
                    Parent / Guardian Phone
                  </label>

                  <input
                    id="guardian_phone"
                    name="guardian_phone"
                    type="tel"
                    placeholder="Enter parent mobile number"
                    value={
                      formData.guardian_phone
                    }
                    onChange={handleChange}
                  />

                  <small className="form-help">
                    This number will later be
                    used for meal and emergency
                    notifications.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="parent_email">
                    Parent Email
                  </label>

                  <input
                    id="parent_email"
                    name="parent_email"
                    type="email"
                    placeholder="Enter parent email"
                    value={
                      formData.parent_email
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emergency_contact">
                    Emergency Contact
                  </label>

                  <input
                    id="emergency_contact"
                    name="emergency_contact"
                    type="tel"
                    placeholder="Emergency contact number"
                    value={
                      formData.emergency_contact
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">
                    Permanent Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="Enter student's permanent address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="student-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingStudent
                    ? "Update Student"
                    : "Create Admission"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ♙
              </div>

              <h3>
                Loading Students...
              </h3>

              <p>
                Please wait while student
                records are loaded.
              </p>
            </div>
          </section>
        ) : students.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ♙
              </div>

              <h3>
                No Students Found
              </h3>

              <p>
                There are currently no
                student records.
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="students-table-card">
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Student Contact</th>
                      <th>Course</th>
                      <th>Year</th>
                      <th>Parent</th>
                      <th>Parent Contact</th>
                      <th>Room Preference</th>
                      <th>Allocated Room</th>
                      <th>Admission</th>
                      <th>Account</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => (
                        <tr key={student.id}>
                          <td>
                            <strong>
                              {student.student_code ||
                                "-"}
                            </strong>
                          </td>

                          <td className="student-name">
                            {student.name}
                          </td>

                          <td>
                            <div>
                              {student.email}
                            </div>

                            <div>
                              {student.phone}
                            </div>
                          </td>

                          <td>
                            {student.course}
                          </td>

                          <td>
                            {student.year}
                          </td>

                          <td>
                            {student.parent_name ||
                              "-"}
                          </td>

                          <td>
                            <div>
                              {student.guardian_phone ||
                                "-"}
                            </div>

                            {student.parent_email && (
                              <div>
                                {
                                  student.parent_email
                                }
                              </div>
                            )}
                          </td>

                          <td>
                            {student.room_preference ||
                              "Not selected"}
                          </td>

                          <td>
                            {student.room_number ||
                              "Not allocated"}
                          </td>

                          <td>
                            <div>
                              <strong>
                                {student.admission_status}
                              </strong>
                            </div>

                            <small>
                              {formatDate(
                                student.admission_date
                              )}
                            </small>
                          </td>

                          <td>
                            <span
                              className={
                                student.user_id
                                  ? "student-status linked"
                                  : "student-status not-linked"
                              }
                            >
                              {student.user_id
                                ? "Account Linked"
                                : "No Account"}
                            </span>
                          </td>

                          <td>
                            <div className="student-actions">
                              <button
                                type="button"
                                className="student-action-button edit"
                                onClick={() =>
                                  openEditForm(
                                    student
                                  )
                                }
                              >
                                Edit
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  className="student-action-button delete"
                                  onClick={() =>
                                    handleDelete(
                                      student
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Students;