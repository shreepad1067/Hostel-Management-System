import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function Fees() {
  const emptyForm = {
    student_id: "",
    amount: "",
    due_date: "",
    payment_date: "",
    status: "Pending",
    payment_method: "",
    description: "",
  };

  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

      const [feesResponse, studentsResponse] =
        await Promise.all([
          api.get("/fees/"),
          api.get("/students/"),
        ]);

      setFees(feesResponse.data);
      setStudents(studentsResponse.data);
    } catch (err) {
      console.error(
        "Failed to load fee data:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Failed to load fee data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingFee(null);

    setFormData({
      ...emptyForm,
      due_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (fee) => {
    setEditingFee(fee);

    setFormData({
      student_id: String(fee.student_id),
      amount: String(fee.amount),
      due_date: fee.due_date || "",
      payment_date: fee.payment_date || "",
      status: fee.status || "Pending",
      payment_method: fee.payment_method || "",
      description: fee.description || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFee(null);
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

      if (!formData.student_id) {
        setError("Please select a student.");
        setSaving(false);
        return;
      }

      if (!formData.amount) {
        setError("Please enter the fee amount.");
        setSaving(false);
        return;
      }

      if (Number(formData.amount) <= 0) {
        setError("Fee amount must be greater than 0.");
        setSaving(false);
        return;
      }

      if (!formData.due_date) {
        setError("Please select the due date.");
        setSaving(false);
        return;
      }

      if (
        formData.status === "Paid" &&
        !formData.payment_date
      ) {
        setError(
          "Payment date is required when the fee is marked as Paid."
        );
        setSaving(false);
        return;
      }

      const payload = {
        student_id: Number(formData.student_id),
        amount: Number(formData.amount),
        due_date: formData.due_date,
        payment_date:
          formData.payment_date || null,
        status: formData.status,
        payment_method:
          formData.payment_method || null,
        description:
          formData.description || null,
      };

      if (editingFee) {
        await api.put(
          `/fees/${editingFee.id}`,
          payload
        );
      } else {
        await api.post("/fees/", payload);
      }

      await fetchData();

      closeForm();
    } catch (err) {
      console.error(
        "Failed to save fee:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save fee record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete fee record #${fee.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/fees/${fee.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to delete fee:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete fee record."
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

    if (normalizedStatus === "paid") {
      return "fee-status paid";
    }

    if (normalizedStatus === "pending") {
      return "fee-status pending";
    }

    if (normalizedStatus === "overdue") {
      return "fee-status overdue";
    }

    return "fee-status other";
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

            <h1>Fees</h1>

            <p>
              Manage hostel fee records and payment
              details.
            </p>
          </div>

          <div className="dashboard-date">
            <span>Total Records</span>

            <strong>{fees.length}</strong>
          </div>
        </header>

        {error && (
          <div className="fees-error">
            <p>{error}</p>
          </div>
        )}

        <section className="overview-card fees-management-card">
          <div className="overview-header">
            <div>
              <h2>Fee Records</h2>

              <p>
                Add, update and manage student fee
                payments.
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
                : "+ Add Fee"}
            </button>
          </div>

          {showForm && (
            <form
              className="fee-form"
              onSubmit={handleSubmit}
            >
              <div className="fee-form-title">
                <div>
                  <h3>
                    {editingFee
                      ? "Edit Fee Record"
                      : "Add Fee Record"}
                  </h3>

                  <p>
                    Enter the student's fee and
                    payment information.
                  </p>
                </div>
              </div>

              <div className="fee-form-grid">
                <div className="form-group">
                  <label htmlFor="student_id">
                    Student
                  </label>

                  <select
                    id="student_id"
                    name="student_id"
                    value={formData.student_id}
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

                <div className="form-group">
                  <label htmlFor="amount">
                    Amount
                  </label>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="due_date">
                    Due Date
                  </label>

                  <input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Paid">
                      Paid
                    </option>

                    <option value="Overdue">
                      Overdue
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="payment_date">
                    Payment Date
                  </label>

                  <input
                    id="payment_date"
                    name="payment_date"
                    type="date"
                    value={
                      formData.payment_date
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="payment_method">
                    Payment Method
                  </label>

                  <select
                    id="payment_method"
                    name="payment_method"
                    value={
                      formData.payment_method
                    }
                    onChange={handleChange}
                  >
                    <option value="">
                      Select method
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
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
                    rows="3"
                    placeholder="Enter fee description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="fee-form-actions">
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
                    : editingFee
                    ? "Update Fee"
                    : "Add Fee"}
                </button>
              </div>
            </form>
          )}
        </section>

        {loading ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ₹
              </div>

              <h3>
                Loading Fee Records...
              </h3>

              <p>
                Please wait while fee records are
                loaded.
              </p>
            </div>
          </section>
        ) : fees.length === 0 ? (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ₹
              </div>

              <h3>
                No Fee Records Found
              </h3>

              <p>
                There are currently no fee records.
              </p>
            </div>
          </section>
        ) : (
          <section className="overview-card">
            <div className="fees-table-card">
              <div className="fees-table-wrapper">
                <table className="fees-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id}>
                        <td>{fee.id}</td>

                        <td className="student-name">
                          {getStudentName(
                            fee.student_id
                          )}
                        </td>

                        <td className="fee-amount">
                          ₹
                          {Number(
                            fee.amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          {fee.due_date}
                        </td>

                        <td>
                          {fee.payment_date ||
                            "Not paid"}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              fee.status
                            )}
                          >
                            {fee.status}
                          </span>
                        </td>

                        <td>
                          {fee.payment_method ||
                            "-"}
                        </td>

                        <td>
                          {fee.description ||
                            "-"}
                        </td>

                        <td>
                          <div className="fee-actions">
                            <button
                              type="button"
                              className="fee-action-button edit"
                              onClick={() =>
                                openEditForm(
                                  fee
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="fee-action-button delete"
                              onClick={() =>
                                handleDelete(
                                  fee
                                )
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

export default Fees;