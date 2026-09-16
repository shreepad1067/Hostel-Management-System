import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Visitors() {
  const emptyForm = {
    student_id: "",
    visitor_name: "",
    relation: "Father",
    phone: "",
    purpose: "",
    visit_date: "",
    check_in: "",
    check_out: "",
    status: "Expected",
    remarks: "",
  };

  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);

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
          "/visitors/my-visitors"
        );

        setVisitors(response.data || []);
        setStudents([]);
      } else {
        const [
          visitorsResponse,
          studentsResponse,
        ] = await Promise.all([
          api.get("/visitors/"),
          api.get("/students/"),
        ]);

        setVisitors(
          visitorsResponse.data || []
        );

        setStudents(
          studentsResponse.data || []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load visitor data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load visitor data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingVisitor(null);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    setFormData({
      ...emptyForm,
      visit_date: today,
    });

    setError("");
    setShowForm(true);
  };

  const formatDateTimeForInput = (dateTime) => {
    if (!dateTime) {
      return "";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    const hours = String(
      date.getHours()
    ).padStart(2, "0");

    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openEditForm = (visitor) => {
    if (isStudent) {
      return;
    }

    setEditingVisitor(visitor);

    setFormData({
      student_id: String(
        visitor.student_id
      ),
      visitor_name:
        visitor.visitor_name || "",
      relation:
        visitor.relation || "Father",
      phone: visitor.phone || "",
      purpose: visitor.purpose || "",
      visit_date:
        visitor.visit_date || "",
      check_in: formatDateTimeForInput(
        visitor.check_in
      ),
      check_out: formatDateTimeForInput(
        visitor.check_out
      ),
      status:
        visitor.status || "Expected",
      remarks: visitor.remarks || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVisitor(null);
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

      if (
        !isStudent &&
        !formData.student_id
      ) {
        setError("Please select a student.");
        setSaving(false);
        return;
      }

      if (!formData.visitor_name.trim()) {
        setError(
          "Please enter the visitor name."
        );
        setSaving(false);
        return;
      }

      if (!formData.phone.trim()) {
        setError(
          "Please enter the visitor phone number."
        );
        setSaving(false);
        return;
      }

      if (!formData.purpose.trim()) {
        setError(
          "Please enter the purpose of visit."
        );
        setSaving(false);
        return;
      }

      if (!formData.visit_date) {
        setError(
          "Please select the visit date."
        );
        setSaving(false);
        return;
      }

      if (
        formData.check_in &&
        formData.check_out &&
        formData.check_out <
          formData.check_in
      ) {
        setError(
          "Check-out time cannot be before check-in time."
        );
        setSaving(false);
        return;
      }

      if (isStudent) {
        if (editingVisitor) {
          setError(
            "Students cannot edit visitor requests."
          );
          setSaving(false);
          return;
        }

        const payload = {
          student_id: 0,
          visitor_name:
            formData.visitor_name.trim(),
          relation: formData.relation,
          phone: formData.phone.trim(),
          purpose: formData.purpose.trim(),
          visit_date: formData.visit_date,
          check_in: formData.check_in
            ? formData.check_in
            : null,
          check_out: formData.check_out
            ? formData.check_out
            : null,
          status: "Pending",
          remarks:
            formData.remarks.trim() ||
            null,
        };

        await api.post(
          "/visitors/my-visitor",
          payload
        );
      } else {
        const payload = {
          student_id: Number(
            formData.student_id
          ),
          visitor_name:
            formData.visitor_name.trim(),
          relation: formData.relation,
          phone: formData.phone.trim(),
          purpose: formData.purpose.trim(),
          visit_date: formData.visit_date,
          check_in: formData.check_in
            ? formData.check_in
            : null,
          check_out: formData.check_out
            ? formData.check_out
            : null,
          status: formData.status,
          remarks:
            formData.remarks.trim() ||
            null,
        };

        if (editingVisitor) {
          await api.put(
            `/visitors/${editingVisitor.id}`,
            payload
          );
        } else {
          await api.post(
            "/visitors/",
            payload
          );
        }
      }

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save visitor:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save visitor record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (visitor) => {
    if (isStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete visitor record #${visitor.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/visitors/${visitor.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to delete visitor:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete visitor record."
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

    if (
      normalizedStatus === "approved"
    ) {
      return "visitor-status approved";
    }

    if (
      normalizedStatus === "rejected"
    ) {
      return "visitor-status rejected";
    }

    if (
      normalizedStatus === "pending"
    ) {
      return "visitor-status pending";
    }

    if (
      normalizedStatus === "expected"
    ) {
      return "visitor-status expected";
    }

    if (
      normalizedStatus === "completed"
    ) {
      return "visitor-status completed";
    }

    return "visitor-status other";
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return dateTime;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

            <h1>Visitors</h1>

            <p>
              {isStudent
                ? "Submit and track your hostel visitor requests."
                : "Manage visitor records, visit details and visitor status."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              {isStudent
                ? "My Visitors"
                : "Total Records"}
            </span>

            <strong>
              {visitors.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="visitor-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card visitor-management-card">
          <div className="overview-header">
            <div>
              <h2>
                {isStudent
                  ? "My Visitors"
                  : "Visitor Records"}
              </h2>

              <p>
                {isStudent
                  ? "View your visitor requests and their current status."
                  : "Add, update and manage hostel visitor records."}
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
                : "+ Add Visitor"}
            </button>
          </div>

          {showForm && (
            <form
              className="visitor-management-form"
              onSubmit={handleSubmit}
            >
              <div className="visitor-management-form-title">
                <div>
                  <h3>
                    {isStudent
                      ? "Submit Visitor Request"
                      : editingVisitor
                      ? "Edit Visitor"
                      : "Add Visitor"}
                  </h3>

                  <p>
                    {isStudent
                      ? "Enter the visitor information and visit details."
                      : "Enter the visitor information and visit details."}
                  </p>
                </div>
              </div>

              <div className="visitor-management-form-grid">
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

                      {students.map(
                        (student) => (
                          <option
                            key={
                              student.id
                            }
                            value={
                              student.id
                            }
                          >
                            {student.name} — ID{" "}
                            {student.id}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="visitor_name">
                    Visitor Name
                  </label>

                  <input
                    id="visitor_name"
                    name="visitor_name"
                    type="text"
                    placeholder="Enter visitor name"
                    value={
                      formData.visitor_name
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="relation">
                    Relation
                  </label>

                  <select
                    id="relation"
                    name="relation"
                    value={
                      formData.relation
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="Father">
                      Father
                    </option>

                    <option value="Mother">
                      Mother
                    </option>

                    <option value="Brother">
                      Brother
                    </option>

                    <option value="Sister">
                      Sister
                    </option>

                    <option value="Friend">
                      Friend
                    </option>

                    <option value="Relative">
                      Relative
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
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
                    value={
                      formData.phone
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="purpose">
                    Purpose
                  </label>

                  <input
                    id="purpose"
                    name="purpose"
                    type="text"
                    placeholder="Reason for visit"
                    value={
                      formData.purpose
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="visit_date">
                    Visit Date
                  </label>

                  <input
                    id="visit_date"
                    name="visit_date"
                    type="date"
                    value={
                      formData.visit_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check_in">
                    Check-in
                  </label>

                  <input
                    id="check_in"
                    name="check_in"
                    type="datetime-local"
                    value={
                      formData.check_in
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check_out">
                    Check-out
                  </label>

                  <input
                    id="check_out"
                    name="check_out"
                    type="datetime-local"
                    value={
                      formData.check_out
                    }
                    onChange={handleChange}
                  />
                </div>

                {!isStudent && (
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
                      <option value="Expected">
                        Expected
                      </option>

                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Approved">
                        Approved
                      </option>

                      <option value="Rejected">
                        Rejected
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>
                  </div>
                )}

                <div className="form-group form-group-full">
                  <label htmlFor="remarks">
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="3"
                    placeholder="Enter remarks"
                    value={
                      formData.remarks
                    }
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="visitor-management-form-actions">
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
                    ? "Submit Visitor"
                    : editingVisitor
                    ? "Update Visitor"
                    : "Add Visitor"}
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
                Loading Visitor Records...
              </h3>

              <p>
                Please wait while visitor
                records are loaded.
              </p>
            </div>
          </section>
        ) : visitors.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ♙
              </div>

              <h3>
                No Visitor Records Found
              </h3>

              <p>
                {isStudent
                  ? "You currently have no visitor requests."
                  : "There are currently no visitor records."}
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="visitor-management-table-card">
              <div className="visitor-management-table-wrapper">
                <table className="visitor-management-table">
                  <thead>
                    <tr>
                      <th>ID</th>

                      {!isStudent && (
                        <th>Student</th>
                      )}

                      <th>Visitor Name</th>
                      <th>Relation</th>
                      <th>Phone</th>
                      <th>Purpose</th>
                      <th>Visit Date</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Status</th>
                      <th>Remarks</th>

                      {!isStudent && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {visitors.map(
                      (visitor) => (
                        <tr
                          key={
                            visitor.id
                          }
                        >
                          <td>
                            {visitor.id}
                          </td>

                          {!isStudent && (
                            <td className="student-name">
                              {getStudentName(
                                visitor.student_id
                              )}
                            </td>
                          )}

                          <td className="visitor-management-name">
                            {
                              visitor.visitor_name
                            }
                          </td>

                          <td>
                            {
                              visitor.relation
                            }
                          </td>

                          <td>
                            {visitor.phone}
                          </td>

                          <td className="visitor-management-purpose">
                            {visitor.purpose}
                          </td>

                          <td>
                            {
                              visitor.visit_date
                            }
                          </td>

                          <td>
                            {formatDateTime(
                              visitor.check_in
                            )}
                          </td>

                          <td>
                            {formatDateTime(
                              visitor.check_out
                            )}
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                visitor.status
                              )}
                            >
                              {
                                visitor.status
                              }
                            </span>
                          </td>

                          <td className="visitor-management-remarks">
                            {visitor.remarks ||
                              "-"}
                          </td>

                          {!isStudent && (
                            <td>
                              <div className="visitor-management-actions">
                                <button
                                  type="button"
                                  className="visitor-action-button edit"
                                  onClick={() =>
                                    openEditForm(
                                      visitor
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="visitor-action-button delete"
                                  onClick={() =>
                                    handleDelete(
                                      visitor
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

export default Visitors;