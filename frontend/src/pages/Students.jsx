import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Students() {
  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    course: "",
    year: "",
    room_number: "",
    user_id: "",
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const getApiErrorMessage = (err, defaultMessage) => {
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

          return `${location}: ${item.msg || "Invalid input"}`;
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

      const response = await api.get("/students/");

      setStudents(response.data);
    } catch (err) {
      console.error("Failed to load students:", err);

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
      user_id: student.user_id || "",
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
        room_number: formData.room_number.trim() || null,
        user_id: formData.user_id
          ? Number(formData.user_id)
          : null,
      };

      if (editingStudent) {
        await api.put(
          `/students/${editingStudent.id}`,
          payload
        );
      } else {
        await api.post("/students/", payload);
      }

      await fetchStudents();
      closeForm();
    } catch (err) {
      console.error("Failed to save student:", err);

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

      await api.delete(`/students/${student.id}`);

      await fetchStudents();
    } catch (err) {
      console.error("Failed to delete student:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete student."
        )
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              MANAGEMENT
            </span>

            <h1>Students</h1>

            <p>
              Manage student records and user account links.
            </p>
          </div>

          <div className="dashboard-date">
            <span>TOTAL STUDENTS</span>
            <strong>{students.length}</strong>
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
              <h2>Student Records</h2>

              <p>
                Add, update, and manage hostel student records.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={
                showForm ? closeForm : openAddForm
              }
            >
              {showForm ? "Close Form" : "+ Add Student"}
            </button>
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
                      ? "Edit Student"
                      : "Add New Student"}
                  </h3>

                  <p>
                    Enter the student's details below.
                  </p>
                </div>
              </div>

              <div className="student-form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    Student Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email
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
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
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
                    Year
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
                  <label htmlFor="room_number">
                    Room Number
                  </label>

                  <input
                    id="room_number"
                    name="room_number"
                    type="text"
                    placeholder="Example: A-105"
                    value={formData.room_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="user_id">
                    Student User ID
                  </label>

                  <input
                    id="user_id"
                    name="user_id"
                    type="number"
                    min="1"
                    placeholder="Optional — link a Student user"
                    value={formData.user_id}
                    onChange={handleChange}
                  />

                  <small className="form-help">
                    Leave empty if this student does not
                    have a login account yet.
                  </small>
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
                    : "Add Student"}
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

              <h3>Loading Students...</h3>

              <p>
                Please wait while student records are loaded.
              </p>
            </div>
          </section>
        ) : students.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ♙
              </div>

              <h3>No Students Found</h3>

              <p>
                There are currently no student records.
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
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Year</th>
                      <th>Room</th>
                      <th>User ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.id}</td>

                        <td className="student-name">
                          {student.name}
                        </td>

                        <td>{student.email}</td>

                        <td>{student.phone}</td>

                        <td>{student.course}</td>

                        <td>{student.year}</td>

                        <td>
                          {student.room_number ||
                            "Not allocated"}
                        </td>

                        <td>
                          {student.user_id ||
                            "Not linked"}
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
                              ? "Linked"
                              : "Not linked"}
                          </span>
                        </td>

                        <td>
                          <div className="student-actions">
                            <button
                              type="button"
                              className="student-action-button edit"
                              onClick={() =>
                                openEditForm(student)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="student-action-button delete"
                              onClick={() =>
                                handleDelete(student)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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