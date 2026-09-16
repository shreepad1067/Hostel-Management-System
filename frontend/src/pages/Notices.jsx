import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Notices() {
  const emptyForm = {
    title: "",
    content: "",
    category: "General",
    notice_date: "",
    expiry_date: "",
    status: "Active",
    remarks: "",
  };

  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

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
    fetchNotices();
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

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notices/");

      setNotices(response.data || []);
    } catch (err) {
      console.error("Failed to load notices:", err);

      setError(
        getApiErrorMessage(
          err,
          "Failed to load notices."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    if (isStudent) {
      return;
    }

    setEditingNotice(null);

    const today = new Date()
      .toISOString()
      .split("T")[0];

    setFormData({
      ...emptyForm,
      notice_date: today,
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (notice) => {
    if (isStudent) {
      return;
    }

    setEditingNotice(notice);

    setFormData({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "General",
      notice_date: notice.notice_date || "",
      expiry_date: notice.expiry_date || "",
      status: notice.status || "Active",
      remarks: notice.remarks || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNotice(null);
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

    if (isStudent) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (!formData.title.trim()) {
        setError("Please enter the notice title.");
        setSaving(false);
        return;
      }

      if (!formData.content.trim()) {
        setError("Please enter the notice content.");
        setSaving(false);
        return;
      }

      if (!formData.category.trim()) {
        setError("Please select a category.");
        setSaving(false);
        return;
      }

      if (!formData.notice_date) {
        setError("Please select the notice date.");
        setSaving(false);
        return;
      }

      if (
        formData.expiry_date &&
        formData.expiry_date < formData.notice_date
      ) {
        setError(
          "Expiry date cannot be before notice date."
        );
        setSaving(false);
        return;
      }

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        notice_date: formData.notice_date,
        expiry_date: formData.expiry_date
          ? formData.expiry_date
          : null,
        status: formData.status,
        remarks:
          formData.remarks.trim() || null,
      };

      if (editingNotice) {
        await api.put(
          `/notices/${editingNotice.id}`,
          payload
        );
      } else {
        await api.post(
          "/notices/",
          payload
        );
      }

      await fetchNotices();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save notice:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save notice."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notice) => {
    if (isStudent) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete notice #${notice.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/notices/${notice.id}`
      );

      await fetchNotices();
    } catch (err) {
      console.error(
        "Failed to delete notice:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete notice."
        )
      );
    }
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "active") {
      return "notice-management-status active";
    }

    if (normalizedStatus === "expired") {
      return "notice-management-status expired";
    }

    if (normalizedStatus === "inactive") {
      return "notice-management-status inactive";
    }

    return "notice-management-status other";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(
      `${dateValue}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

            <h1>Notices</h1>

            <p>
              {isStudent
                ? "View hostel announcements and important notices."
                : "Manage hostel announcements and important notices."}
            </p>
          </div>

          <div className="dashboard-date">
            <span>
              {isStudent
                ? "My Notices"
                : "Total Notices"}
            </span>

            <strong>
              {notices.length}
            </strong>
          </div>
        </header>

        {error && (
          <div className="notice-management-error">
            <p>{error}</p>
          </div>
        )}

        {!isStudent && (
          <section className="notice-management-summary-grid">
            <div className="notice-management-summary-card">
              <div className="notice-management-summary-icon">
                ◉
              </div>

              <div>
                <span>Total Notices</span>

                <strong>
                  {notices.length}
                </strong>
              </div>
            </div>

            <div className="notice-management-summary-card">
              <div className="notice-management-summary-icon">
                ✓
              </div>

              <div>
                <span>Active Notices</span>

                <strong>
                  {
                    notices.filter(
                      (notice) =>
                        String(
                          notice.status || ""
                        ).toLowerCase() === "active"
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="notice-management-summary-card">
              <div className="notice-management-summary-icon">
                #
              </div>

              <div>
                <span>Categories</span>

                <strong>
                  {
                    new Set(
                      notices.map(
                        (notice) =>
                          notice.category
                      )
                    ).size
                  }
                </strong>
              </div>
            </div>
          </section>
        )}

        <section className="overview-card notice-management-card">
          <div className="overview-header">
            <div>
              <h2>
                {isStudent
                  ? "Hostel Notices"
                  : "Notice Records"}
              </h2>

              <p>
                {isStudent
                  ? "View important hostel announcements and notice details."
                  : "Add, update and manage hostel notices."}
              </p>
            </div>

            {!isStudent && (
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
                  : "+ Add Notice"}
              </button>
            )}
          </div>

          {!isStudent && showForm && (
            <form
              className="notice-management-form"
              onSubmit={handleSubmit}
            >
              <div className="notice-management-form-title">
                <div>
                  <h3>
                    {editingNotice
                      ? "Edit Notice"
                      : "Add Notice"}
                  </h3>

                  <p>
                    Enter the notice information and
                    publication details.
                  </p>
                </div>
              </div>

              <div className="notice-management-form-grid">
                <div className="form-group">
                  <label htmlFor="title">
                    Notice Title
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Enter notice title"
                    value={
                      formData.title
                    }
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
                    value={
                      formData.category
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="General">
                      General
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                    <option value="Fee">
                      Fee
                    </option>

                    <option value="Event">
                      Event
                    </option>

                    <option value="Academic">
                      Academic
                    </option>

                    <option value="Holiday">
                      Holiday
                    </option>

                    <option value="Emergency">
                      Emergency
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notice_date">
                    Notice Date
                  </label>

                  <input
                    id="notice_date"
                    name="notice_date"
                    type="date"
                    value={
                      formData.notice_date
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiry_date">
                    Expiry Date
                  </label>

                  <input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    value={
                      formData.expiry_date
                    }
                    onChange={handleChange}
                  />
                </div>

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
                    <option value="Active">
                      Active
                    </option>

                    <option value="Expired">
                      Expired
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="content">
                    Notice Content
                  </label>

                  <textarea
                    id="content"
                    name="content"
                    rows="5"
                    placeholder="Enter notice content"
                    value={
                      formData.content
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

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

              <div className="notice-management-form-actions">
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
                    : editingNotice
                    ? "Update Notice"
                    : "Add Notice"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ◷
              </div>

              <h3>
                Loading Notice Records...
              </h3>

              <p>
                Please wait while notice records
                are loaded.
              </p>
            </div>
          </section>
        ) : notices.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ◉
              </div>

              <h3>
                No Notice Records Found
              </h3>

              <p>
                {isStudent
                  ? "There are currently no hostel notices."
                  : "There are currently no notice records."}
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="notice-management-table-card">
              <div className="notice-management-table-wrapper">
                <table className="notice-management-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Notice Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Content</th>
                      <th>Remarks</th>

                      {!isStudent && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {notices.map((notice) => (
                      <tr key={notice.id}>
                        <td>
                          {notice.id}
                        </td>

                        <td className="notice-management-title">
                          {notice.title}
                        </td>

                        <td>
                          {notice.category}
                        </td>

                        <td>
                          {formatDate(
                            notice.notice_date
                          )}
                        </td>

                        <td>
                          {formatDate(
                            notice.expiry_date
                          )}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              notice.status
                            )}
                          >
                            {notice.status}
                          </span>
                        </td>

                        <td className="notice-management-content">
                          {notice.content}
                        </td>

                        <td className="notice-management-remarks">
                          {notice.remarks ||
                            "-"}
                        </td>

                        {!isStudent && (
                          <td>
                            <div className="notice-management-actions">
                              <button
                                type="button"
                                className="notice-action-button edit"
                                onClick={() =>
                                  openEditForm(
                                    notice
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="notice-action-button delete"
                                onClick={() =>
                                  handleDelete(
                                    notice
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
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

export default Notices;