import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Complaints() {
  const emptyForm = {
    student_id: "",
    title: "",
    description: "",
    category: "General",
    complaint_date: "",
    status: "Pending",
    resolution: "",
  };

  const [complaints, setComplaints] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] =
    useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const getUserRole = () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return "Guest";
      }

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      return payload.role || "Student";
    } catch {
      return "Student";
    }
  };

  const role = getUserRole();
  const isStudent = role === "Student";

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      if (isStudent) {
        const response = await api.get(
          "/complaints/"
        );

        setComplaints(response.data || []);
        setStudents([]);
      } else {
        const [
          complaintsResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("/complaints/"),
          api.get("/students/"),
        ]);

        setComplaints(
          complaintsResponse.data || []
        );

        setStudents(
          studentsResponse.data || []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load complaint data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load complaint data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingComplaint(null);

    setFormData({
      ...emptyForm,
      complaint_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (complaint) => {
    if (isStudent) {
      return;
    }

    setEditingComplaint(complaint);

    setFormData({
      student_id: String(
        complaint.student_id
      ),
      title: complaint.title || "",
      description:
        complaint.description || "",
      category:
        complaint.category || "General",
      complaint_date:
        complaint.complaint_date || "",
      status:
        complaint.status || "Pending",
      resolution:
        complaint.resolution || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingComplaint(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!formData.title.trim()) {
        setError("Please enter the complaint title.");
        setSaving(false);
        return;
      }

      if (!formData.description.trim()) {
        setError(
          "Please enter the complaint description."
        );
        setSaving(false);
        return;
      }

      if (!formData.complaint_date) {
        setError(
          "Please select the complaint date."
        );
        setSaving(false);
        return;
      }

      if (!isStudent && !formData.student_id) {
        setError("Please select a student.");
        setSaving(false);
        return;
      }

      if (isStudent && editingComplaint) {
        setError(
          "Students cannot edit complaints."
        );
        setSaving(false);
        return;
      }

      if (isStudent) {
        const payload = {
          student_id: 0,
          title: formData.title.trim(),
          description:
            formData.description.trim(),
          category: formData.category,
          complaint_date:
            formData.complaint_date,
          status: "Pending",
          resolution: null,
        };

        await api.post(
          "/complaints/",
          payload
        );
      } else {
        const payload = {
          student_id: Number(
            formData.student_id
          ),
          title: formData.title.trim(),
          description:
            formData.description.trim(),
          category: formData.category,
          complaint_date:
            formData.complaint_date,
          status: formData.status,
          resolution:
            formData.resolution.trim() || null,
        };

        if (editingComplaint) {
          await api.put(
            `/complaints/${editingComplaint.id}`,
            payload
          );
        } else {
          await api.post(
            "/complaints/",
            payload
          );
        }
      }

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save complaint:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save complaint."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (complaint) => {
    if (isStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete complaint #${complaint.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/complaints/${complaint.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to delete complaint:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete complaint."
        )
      );
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(
      (item) => item.id === studentId
    );

    return student
      ? student.name
      : `Student #${studentId}`;
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "resolved") {
      return "complaint-status resolved";
    }

    if (normalizedStatus === "in progress") {
      return "complaint-status progress";
    }

    if (normalizedStatus === "pending") {
      return "complaint-status pending";
    }

    return "complaint-status other";
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              {isStudent
                ? "STUDENT"
                : "MANAGEMENT"}
            </span>

            <h1>Complaints</h1>

            <p>
              {isStudent
                ? "Submit and track your hostel complaints."
                : "Manage student complaints, status and resolution details."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              {isStudent
                ? "My Complaints"
                : "Total Records"}
            </span>

            <strong>
              {complaints.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="complaints-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card complaints-management-card">
          <div className="overview-header">
            <div>
              <h2>
                {isStudent
                  ? "My Complaints"
                  : "Complaint Records"}
              </h2>

              <p>
                {isStudent
                  ? "View your submitted complaints and their current status."
                  : "Add, update and manage student complaints."}
              </p>
            </div>

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
                : "+ Add Complaint"}
            </button>
          </div>

          {showForm && (
            <form
              className="complaint-form"
              onSubmit={handleSubmit}
            >
              <div className="complaint-form-title">
                <div>
                  <h3>
                    {isStudent
                      ? "Submit Complaint"
                      : editingComplaint
                      ? "Edit Complaint"
                      : "Add Complaint"}
                  </h3>

                  <p>
                    {isStudent
                      ? "Enter the details of your hostel complaint."
                      : "Enter the complaint and resolution information."}
                  </p>
                </div>
              </div>

              <div className="complaint-form-grid">
                {!isStudent && (
                  <div className="form-group">
                    <label htmlFor="student_id">
                      Student
                    </label>

                    <select
                      id="student_id"
                      name="student_id"
                      value={
                        formData.student_id
                      }
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Select student
                      </option>

                      {students.map((student) => (
                        <option
                          key={student.id}
                          value={student.id}
                        >
                          {student.name} — ID{" "}
                          {student.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="complaint_date">
                    Complaint Date
                  </label>

                  <input
                    id="complaint_date"
                    name="complaint_date"
                    type="date"
                    value={
                      formData.complaint_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="title">
                    Title
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Enter complaint title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="General">
                      General
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                    <option value="Food">
                      Food
                    </option>

                    <option value="Cleanliness">
                      Cleanliness
                    </option>

                    <option value="Electricity">
                      Electricity
                    </option>

                    <option value="Water">
                      Water
                    </option>

                    <option value="Room">
                      Room
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="description">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    placeholder="Describe the complaint"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {!isStudent && (
                  <>
                    <div className="form-group">
                      <label htmlFor="status">
                        Status
                      </label>

                      <select
                        id="status"
                        name="status"
                        value={
                          formData.status
                        }
                        onChange={handleChange}
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Resolved">
                          Resolved
                        </option>
                      </select>
                    </div>

                    <div className="form-group form-group-full">
                      <label htmlFor="resolution">
                        Resolution
                      </label>

                      <textarea
                        id="resolution"
                        name="resolution"
                        rows="3"
                        placeholder="Enter resolution details"
                        value={
                          formData.resolution
                        }
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="complaint-form-actions">
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
                    ? "Submitting..."
                    : isStudent
                    ? "Submit Complaint"
                    : editingComplaint
                    ? "Update Complaint"
                    : "Add Complaint"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ⚠
              </div>

              <h3>
                Loading Complaint Records...
              </h3>

              <p>
                Please wait while complaint
                records are loaded.
              </p>
            </div>
          </section>
        ) : complaints.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ⚠
              </div>

              <h3>
                No Complaint Records Found
              </h3>

              <p>
                {isStudent
                  ? "You currently have no complaints."
                  : "There are currently no complaint records."}
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="complaints-table-card">
              <div className="complaints-table-wrapper">
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      {!isStudent && (
                        <th>Student</th>
                      )}

                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Resolution</th>

                      {!isStudent && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {complaints.map(
                      (complaint) => (
                        <tr key={complaint.id}>
                          <td>
                            {complaint.id}
                          </td>

                          {!isStudent && (
                            <td className="student-name">
                              {getStudentName(
                                complaint.student_id
                              )}
                            </td>
                          )}

                          <td className="complaint-title">
                            {complaint.title}
                          </td>

                          <td>
                            {complaint.category}
                          </td>

                          <td>
                            {
                              complaint.complaint_date
                            }
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                complaint.status
                              )}
                            >
                              {complaint.status}
                            </span>
                          </td>

                          <td className="complaint-description">
                            {
                              complaint.description
                            }
                          </td>

                          <td className="complaint-resolution">
                            {complaint.resolution ||
                              "-"}
                          </td>

                          {!isStudent && (
                            <td>
                              <div className="complaint-actions">
                                <button
                                  type="button"
                                  className="complaint-action-button edit"
                                  onClick={() =>
                                    openEditForm(
                                      complaint
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="complaint-action-button delete"
                                  onClick={() =>
                                    handleDelete(
                                      complaint
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
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

export default Complaints;