import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import api from "../services/api";

function MyFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyFees();
  }, []);

  const fetchMyFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/fees/my-fees");

      setFees(response.data);
    } catch (err) {
      console.error("Failed to load fees:", err);

      if (err.response) {
        setError(
          err.response.data.detail ||
            "Unable to load your fee details."
        );
      } else {
        setError("Unable to connect to the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = fees.reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  );

  const pendingAmount = fees
    .filter(
      (fee) =>
        String(fee.status || "").toLowerCase() === "pending"
    )
    .reduce(
      (total, fee) => total + Number(fee.amount || 0),
      0
    );

  const paidAmount = fees
    .filter(
      (fee) =>
        String(fee.status || "").toLowerCase() === "paid"
    )
    .reduce(
      (total, fee) => total + Number(fee.amount || 0),
      0
    );

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

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
              FINANCE
            </span>

            <h1>My Fees</h1>

            <p>
              View your hostel fee records and payment details.
            </p>
          </div>

          <div className="dashboard-date">
            <span>TOTAL RECORDS</span>

            <strong>{fees.length}</strong>
          </div>
        </header>

        {loading && (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                ₹
              </div>

              <h3>Loading Fee Details...</h3>

              <p>
                Please wait while we load your fee information.
              </p>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="overview-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                !
              </div>

              <h3>Unable to Load Fee Details</h3>

              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={fetchMyFees}
                style={{ marginTop: "18px" }}
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="fees-summary-grid">
              <div className="fees-summary-card">
                <div className="fees-summary-icon total">
                  ₹
                </div>

                <div>
                  <span>Total Fees</span>

                  <strong>
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="fees-summary-card">
                <div className="fees-summary-icon pending">
                  !
                </div>

                <div>
                  <span>Pending Amount</span>

                  <strong>
                    ₹{pendingAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="fees-summary-card">
                <div className="fees-summary-icon paid">
                  ✓
                </div>

                <div>
                  <span>Paid Amount</span>

                  <strong>
                    ₹{paidAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </section>

            <section className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>Fee History</h2>

                  <p>
                    Your hostel fee records and payment information.
                  </p>
                </div>
              </div>

              {fees.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    ₹
                  </div>

                  <h3>No Fee Records</h3>

                  <p>
                    No fee records are currently available for your
                    account.
                  </p>
                </div>
              ) : (
                <div className="fees-table-card">
                  <div className="fees-table-wrapper">
                    <table className="fees-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                          <th>Payment Date</th>
                          <th>Status</th>
                          <th>Payment Method</th>
                          <th>Description</th>
                        </tr>
                      </thead>

                      <tbody>
                        {fees.map((fee) => (
                          <tr key={fee.id}>
                            <td>{fee.id}</td>

                            <td className="fee-amount">
                              ₹
                              {Number(
                                fee.amount || 0
                              ).toLocaleString("en-IN")}
                            </td>

                            <td>
                              {fee.due_date || "-"}
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
                              {fee.payment_method || "-"}
                            </td>

                            <td>
                              {fee.description || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default MyFees;