import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";

import api from "../services/api";


function roleFromToken() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    ).role;

  } catch {
    return null;
  }
}


const EMPTY_FEE = {
  student_id:
    "",

  amount:
    "",

  due_date:
    "",

  payment_date:
    "",

  status:
    "Pending",

  payment_method:
    "",

  description:
    "",
};


function Fees() {
  const role =
    roleFromToken();

  const isAdmin =
    role === "Admin";

  const [fees, setFees] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [settings, setSettings] =
    useState(null);

  const [form, setForm] =
    useState(
      EMPTY_FEE
    );

  const [editing, setEditing] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const load =
    useCallback(
      async () => {
        try {
          setError("");

          const [
            feesResponse,
            studentsResponse,
            transactionsResponse,
            settingsResponse,
          ] = await Promise.all([
            api.get(
              "/fees/"
            ),

            api.get(
              "/students/"
            ),

            api.get(
              "/fees/payment-transactions"
            ),

            api.get(
              "/fees/payment-settings"
            ),
          ]);

          setFees(
            feesResponse.data
          );

          setStudents(
            studentsResponse.data
          );

          setTransactions(
            transactionsResponse.data
          );

          setSettings(
            settingsResponse.data
          );

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load fee information."
          );
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const studentName =
    (id) => {
      const student =
        students.find(
          (item) =>
            item.id === id
        );

      if (!student) {
        return `Student #${id}`;
      }

      return (
        `${student.name} - `
        + (
          student.student_code
          || student.id
        )
      );
    };


  const openAdd =
    () => {
      setEditing(null);

      setForm({
        ...EMPTY_FEE,
      });

      setShowForm(true);
    };


  const openEdit =
    (fee) => {
      setEditing(fee);

      setForm({
        student_id:
          String(
            fee.student_id
          ),

        amount:
          String(
            fee.amount
          ),

        due_date:
          fee.due_date
          || "",

        payment_date:
          fee.payment_date
          || "",

        status:
          fee.status,

        payment_method:
          fee.payment_method
          || "",

        description:
          fee.description
          || "",
      });

      setShowForm(true);
    };


  const saveFee =
    async (event) => {
      event.preventDefault();

      try {
        setError("");
        setSuccess("");

        const payload = {
          student_id:
            Number(
              form.student_id
            ),

          amount:
            Number(
              form.amount
            ),

          due_date:
            form.due_date,

          payment_date:
            form.payment_date
            || null,

          status:
            form.status,

          payment_method:
            form.payment_method
            || null,

          description:
            form.description
            || null,
        };

        if (editing) {
          await api.put(
            `/fees/${editing.id}`,
            payload
          );

        } else {
          await api.post(
            "/fees/",
            payload
          );
        }

        setSuccess(
          editing
            ? "Fee updated."
            : "Fee created."
        );

        setEditing(null);
        setShowForm(false);

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to save fee."
        );
      }
    };


  const deleteFee =
    async (fee) => {
      if (
        !window.confirm(
          "Delete this fee?"
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/fees/${fee.id}`
        );

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to delete fee."
        );
      }
    };


  const saveSettings =
    async (event) => {
      event.preventDefault();

      try {
        const response =
          await api.put(
            "/fees/payment-settings",
            settings
          );

        setSettings(
          response.data
        );

        setSuccess(
          "Payment settings updated."
        );

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to update payment settings."
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
              {isAdmin
                ? "ADMIN FINANCE"
                : "WARDEN MONITORING"}
            </span>

            <h1>
              Fees
            </h1>

            <p>
              {isAdmin
                ? "Manage hostel fees and payment settings."
                : "Monitor hostel fee payments."}
            </p>
          </div>
        </header>


        {error && (
          <div className="fees-error">
            <p>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom:
                "18px",

              padding:
                "14px",

              borderRadius:
                "10px",

              color:
                "#067647",

              background:
                "#ecfdf3",
            }}
          >
            {success}
          </div>
        )}


        {isAdmin && settings && (
          <section
            className="overview-card"
            style={{
              marginBottom:
                "22px",
            }}
          >
            <h2>
              Online Payment Settings
            </h2>

            <form
              className="fee-form"
              onSubmit={
                saveSettings
              }
            >
              <div className="fee-form-grid">
                <div className="form-group">
                  <label>
                    Account Holder
                  </label>

                  <input
                    value={
                      settings.account_holder_name
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          account_holder_name:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Bank Name
                  </label>

                  <input
                    value={
                      settings.bank_name
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          bank_name:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Account Last 4
                  </label>

                  <input
                    maxLength="4"
                    value={
                      settings.account_last4
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          account_last4:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    IFSC
                  </label>

                  <input
                    value={
                      settings.ifsc_code
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          ifsc_code:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    UPI ID
                  </label>

                  <input
                    value={
                      settings.upi_id
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          upi_id:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Support Email
                  </label>

                  <input
                    type="email"
                    value={
                      settings.support_email
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          support_email:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>
                    Maintenance Message
                  </label>

                  <textarea
                    rows="3"
                    value={
                      settings.failure_message
                      || ""
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          failure_message:
                            event.target.value,
                        })
                    }
                  />
                </div>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      Boolean(
                        settings.payment_enabled
                      )
                    }
                    onChange={
                      (event) =>
                        setSettings({
                          ...settings,

                          payment_enabled:
                            event.target.checked,
                        })
                    }
                  />

                  {" "}
                  Online payment enabled
                </label>
              </div>

              <button
                type="submit"
                className="primary-button"
              >
                Save Payment Settings
              </button>
            </form>
          </section>
        )}


        {isAdmin && (
          <section
            className="overview-card"
            style={{
              marginBottom:
                "22px",
            }}
          >
            <div className="overview-header">
              <h2>
                Fee Management
              </h2>

              <button
                type="button"
                className="primary-button"
                onClick={
                  showForm
                    ? () =>
                        setShowForm(false)
                    : openAdd
                }
              >
                {showForm
                  ? "Close"
                  : "+ Add Fee"}
              </button>
            </div>


            {showForm && (
              <form
                className="fee-form"
                onSubmit={saveFee}
              >
                <div className="fee-form-grid">
                  <div className="form-group">
                    <label>
                      Student
                    </label>

                    <select
                      required
                      value={
                        form.student_id
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            student_id:
                              event.target.value,
                          })
                      }
                    >
                      <option value="">
                        Select Student
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
                            {student.name}
                            {" - "}
                            {student.student_code
                              || student.id}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Amount
                    </label>

                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={
                        form.amount
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            amount:
                              event.target.value,
                          })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Due Date
                    </label>

                    <input
                      required
                      type="date"
                      value={
                        form.due_date
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            due_date:
                              event.target.value,
                          })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Status
                    </label>

                    <select
                      value={
                        form.status
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            status:
                              event.target.value,
                          })
                      }
                    >
                      <option>
                        Pending
                      </option>

                      <option>
                        Paid
                      </option>

                      <option>
                        Overdue
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Payment Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.payment_date
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            payment_date:
                              event.target.value,
                          })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Payment Method
                    </label>

                    <input
                      value={
                        form.payment_method
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            payment_method:
                              event.target.value,
                          })
                      }
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>
                      Description
                    </label>

                    <textarea
                      rows="3"
                      value={
                        form.description
                      }
                      onChange={
                        (event) =>
                          setForm({
                            ...form,

                            description:
                              event.target.value,
                          })
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editing
                    ? "Update Fee"
                    : "Add Fee"}
                </button>
              </form>
            )}
          </section>
        )}


        <section className="overview-card">
          <h2>
            Fee Records
          </h2>

          <div className="fees-table-wrapper">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Method</th>

                  {isAdmin && (
                    <th>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {fees.map(
                  (fee) => (
                    <tr key={fee.id}>
                      <td>
                        {studentName(
                          fee.student_id
                        )}
                      </td>

                      <td>
                        ₹{Number(
                          fee.amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {fee.due_date}
                      </td>

                      <td>
                        {fee.status}
                      </td>

                      <td>
                        {fee.payment_method
                          || "-"}
                      </td>

                      {isAdmin && (
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                fee
                              )
                            }
                          >
                            Edit
                          </button>

                          {" "}

                          <button
                            type="button"
                            onClick={() =>
                              deleteFee(
                                fee
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>


        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >
          <h2>
            Payment Transactions
          </h2>

          <div className="fees-table-wrapper">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Receipt</th>
                  <th>Failure</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        #{record.id}
                      </td>

                      <td>
                        {studentName(
                          record.student_id
                        )}
                      </td>

                      <td>
                        ₹{Number(
                          record.amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {record.status}
                      </td>

                      <td>
                        {record.payment_reference
                          || "-"}
                      </td>

                      <td>
                        {record.receipt_number
                          || "-"}
                      </td>

                      <td>
                        {record.failure_reason
                          || "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}


export default Fees;