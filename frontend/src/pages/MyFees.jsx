import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";

import api from "../services/api";


function MyFees() {
  const [fees, setFees] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [settings, setSettings] =
    useState(null);

  const [payment, setPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            feesResponse,
            transactionsResponse,
            settingsResponse,
          ] = await Promise.all([
            api.get(
              "/fees/my-fees"
            ),

            api.get(
              "/fees/my-payment-transactions"
            ),

            api.get(
              "/fees/payment-settings"
            ),
          ]);

          setFees(
            feesResponse.data
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
            "Unable to load fee details."
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    load();
  }, [load]);


  const startPayment =
    async (fee) => {
      try {
        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/fees/payments/${fee.id}/start`
          );

        setPayment(
          response.data
        );

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to start payment."
        );
      }
    };


  const completePayment =
    async () => {
      try {
        const response =
          await api.post(
            `/fees/payments/${payment.transaction_id}/complete-demo`
          );

        setSuccess(
          `Payment successful. Receipt: ${response.data.receipt_number}`
        );

        setPayment(null);

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Payment could not be completed."
        );
      }
    };


  const failPayment =
    async () => {
      try {
        await api.post(
          `/fees/payments/${payment.transaction_id}/fail-demo`,
          {
            reason:
              "Demo payment failure",
          }
        );

        setPayment(null);

        setError(
          "Demo payment failed and was recorded."
        );

        await load();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to record payment failure."
        );
      }
    };


  const total =
    fees.reduce(
      (sum, fee) =>
        sum
        + Number(
          fee.amount || 0
        ),
      0
    );


  const paid =
    fees
      .filter(
        (fee) =>
          String(
            fee.status
          ).toLowerCase()
          === "paid"
      )
      .reduce(
        (sum, fee) =>
          sum
          + Number(
            fee.amount || 0
          ),
        0
      );


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-label">
              STUDENT FINANCE
            </span>

            <h1>
              My Fees
            </h1>

            <p>
              View and pay your hostel fees.
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

              background:
                "#ecfdf3",

              color:
                "#067647",
            }}
          >
            {success}
          </div>
        )}


        {loading ? (
          <section className="overview-card">
            Loading fees...
          </section>

        ) : (
          <>
            <section className="fees-summary-grid">
              <div className="fees-summary-card">
                <div>
                  <span>
                    Total Fees
                  </span>

                  <strong>
                    ₹{total.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>

              <div className="fees-summary-card">
                <div>
                  <span>
                    Paid
                  </span>

                  <strong>
                    ₹{paid.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>

              <div className="fees-summary-card">
                <div>
                  <span>
                    Pending
                  </span>

                  <strong>
                    ₹{(
                      total - paid
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              </div>
            </section>


            {settings && (
              <section
                className="overview-card"
                style={{
                  marginBottom:
                    "22px",
                }}
              >
                <h2>
                  Online Payment
                </h2>

                <p>
                  Current project payment
                  mode: <strong>Demo/Test</strong>
                </p>

                <p>
                  UPI:{" "}
                  {settings.upi_id
                    || "Not configured"}
                </p>

                <p>
                  Bank:{" "}
                  {settings.bank_name
                    || "Not configured"}
                </p>

                <p>
                  Account:{" "}
                  {settings.account_last4
                    ? `•••• ${settings.account_last4}`
                    : "Not configured"}
                </p>
              </section>
            )}


            {payment && (
              <section
                className="overview-card"
                style={{
                  marginBottom:
                    "22px",
                }}
              >
                <h2>
                  Demo Payment
                </h2>

                <p>
                  Amount: ₹
                  {Number(
                    payment.amount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>

                <div
                  style={{
                    display:
                      "flex",

                    gap:
                      "12px",

                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      completePayment
                    }
                  >
                    Complete Payment
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      failPayment
                    }
                  >
                    Simulate Failure
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPayment(null)
                    }
                  >
                    Cancel
                  </button>
                </div>
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
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fees.map(
                      (fee) => (
                        <tr key={fee.id}>
                          <td>
                            {fee.description
                              || `Fee #${fee.id}`}
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
                            {String(
                              fee.status
                            ).toLowerCase()
                            === "paid" ? (
                              <strong>
                                ✓ Paid
                              </strong>

                            ) : (
                              <button
                                type="button"
                                className="primary-button"
                                disabled={
                                  !settings
                                  ?.payment_enabled
                                }
                                onClick={() =>
                                  startPayment(
                                    fee
                                  )
                                }
                              >
                                Pay Online
                              </button>
                            )}
                          </td>
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
                Transactions
              </h2>

              <div className="fees-table-wrapper">
                <table className="fees-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Reference</th>
                      <th>Receipt</th>
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
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}


export default MyFees;