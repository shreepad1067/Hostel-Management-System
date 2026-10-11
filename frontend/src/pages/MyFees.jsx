import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./MyFees.css";

import api from "../services/api";


function formatMoney(
  value
) {
  const amount =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(amount);
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function getErrorMessage(
  error,
  fallback
) {
  const detail =
    error?.response
      ?.data
      ?.detail;

  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }

  return fallback;
}


function MyFees() {
  const [
    fees,
    setFees,
  ] = useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    paymentSettings,
    setPaymentSettings,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    activePayment,
    setActivePayment,
  ] = useState(null);

  const [
    paymentProcessing,
    setPaymentProcessing,
  ] = useState(false);

  const [
    downloadingReceipt,
    setDownloadingReceipt,
  ] = useState(null);


  // ==========================================
  // LOAD
  // ==========================================

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const [
            feesResult,
            transactionResult,
            settingsResult,
          ] =
            await Promise.allSettled([
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


          if (
            feesResult.status ===
            "fulfilled"
          ) {
            setFees(
              Array.isArray(
                feesResult
                  .value
                  .data
              )
                ? feesResult
                    .value
                    .data
                : []
            );

          } else {
            throw (
              feesResult.reason
            );
          }


          if (
            transactionResult.status ===
            "fulfilled"
          ) {
            setTransactions(
              Array.isArray(
                transactionResult
                  .value
                  .data
              )
                ? transactionResult
                    .value
                    .data
                : []
            );

          } else {
            setTransactions(
              []
            );
          }


          if (
            settingsResult.status ===
            "fulfilled"
          ) {
            setPaymentSettings(
              settingsResult
                .value
                .data
            );

          } else {
            setPaymentSettings(
              null
            );
          }

        } catch (
          requestError
        ) {
          setFees([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load fee information."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadData();
  }, [
    loadData,
  ]);


  // ==========================================
  // FEE ROOM DISPLAY
  // ==========================================

  const feeRoomName = (fee) => {
    if (!fee?.room_id) {
      return "—";
    }

    const description =
      String(fee.description || "");

    const match =
      description.match(
        /Yearly hostel room fee\s*-\s*(.*?)\s*\(/i
      );

    if (match && match[1]) {
      return match[1].trim();
    }

    return `Room #${fee.room_id}`;
  };


  // ==========================================
  // SUMMARY
  // ==========================================

  const summary =
    useMemo(
      () => {
        let total =
          0;

        let paid =
          0;

        let pending =
          0;


        fees.forEach(
          (
            fee
          ) => {
            const amount =
              Number(
                fee.amount
              ) || 0;

            total +=
              amount;


            if (
              String(
                fee.status
              ).toLowerCase() ===
              "paid"
            ) {
              paid +=
                amount;

            } else {
              pending +=
                amount;
            }
          }
        );


        return {
          total,
          paid,
          pending,
        };
      },
      [fees]
    );


  // ==========================================
  // START DEMO PAYMENT
  // ==========================================

  const startPayment =
    async (
      fee
    ) => {
      try {
        setPaymentProcessing(
          true
        );

        setError("");
        setSuccess("");


        const response =
          await api.post(
            `/fees/payments/${fee.id}/start`
          );


        setActivePayment({
          ...response.data,

          fee,
        });

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to start payment."
          )
        );

      } finally {
        setPaymentProcessing(
          false
        );
      }
    };


  // ==========================================
  // COMPLETE DEMO
  // ==========================================

  const completeDemoPayment =
    async () => {
      if (
        !activePayment
      ) {
        return;
      }


      try {
        setPaymentProcessing(
          true
        );

        setError("");
        setSuccess("");


        const response =
          await api.post(
            `/fees/payments/${activePayment.transaction_id}/complete-demo`
          );


        setSuccess(
          response.data
            ?.receipt_number
            ? (
                "Payment completed successfully. "
                + `Receipt: ${response.data.receipt_number}`
              )
            : "Payment completed successfully."
        );


        setActivePayment(
          null
        );


        await loadData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to complete payment."
          )
        );

      } finally {
        setPaymentProcessing(
          false
        );
      }
    };


  // ==========================================
  // FAIL DEMO
  // ==========================================

  const failDemoPayment =
    async () => {
      if (
        !activePayment
      ) {
        return;
      }


      try {
        setPaymentProcessing(
          true
        );

        setError("");
        setSuccess("");


        await api.post(
          `/fees/payments/${activePayment.transaction_id}/fail-demo`,
          {
            reason:
              "Demo payment failure",
          }
        );


        setError(
          "Demo payment marked as failed."
        );


        setActivePayment(
          null
        );


        await loadData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to update demo payment."
          )
        );

      } finally {
        setPaymentProcessing(
          false
        );
      }
    };


  // ==========================================
  // FEATURE 7 — DOWNLOAD PDF RECEIPT
  // ==========================================

  const downloadReceipt =
    async (
      transaction
    ) => {
      try {
        setDownloadingReceipt(
          transaction.id
        );

        setError("");


        const response =
          await api.get(
            `/fee-receipts/${transaction.id}/pdf`,
            {
              responseType:
                "blob",
            }
          );


        const blob =
          new Blob(
            [
              response.data,
            ],
            {
              type:
                "application/pdf",
            }
          );


        const url =
          window.URL
            .createObjectURL(
              blob
            );


        const link =
          document
            .createElement(
              "a"
            );


        link.href =
          url;


        link.download =
          `${transaction.receipt_number || `receipt-${transaction.id}`}.pdf`;


        document.body
          .appendChild(
            link
          );


        link.click();


        link.remove();


        window.URL
          .revokeObjectURL(
            url
          );

      } catch {
        setError(
          "Unable to download the receipt PDF."
        );

      } finally {
        setDownloadingReceipt(
          null
        );
      }
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              FINANCE
            </span>

            <h1>
              My Fees
            </h1>

            <p>
              View hostel fees,
              make payments and
              download receipts.
            </p>

          </div>


          <div className="dashboard-date">

            <span>
              PENDING
            </span>

            <strong>
              {
                formatMoney(
                  summary.pending
                )
              }
            </strong>

          </div>

        </header>


        {error && (
          <div className="fees-error">
            {error}
          </div>
        )}


        {success && (
          <div className="fees-message">
            {success}
          </div>
        )}


        {/* SUMMARY */}

        <section className="fees-summary-grid">

          <div className="fees-summary-card">

            <span>
              Total Fees
            </span>

            <strong>
              {
                formatMoney(
                  summary.total
                )
              }
            </strong>

          </div>


          <div className="fees-summary-card">

            <span>
              Paid
            </span>

            <strong>
              {
                formatMoney(
                  summary.paid
                )
              }
            </strong>

          </div>


          <div className="fees-summary-card">

            <span>
              Pending
            </span>

            <strong>
              {
                formatMoney(
                  summary.pending
                )
              }
            </strong>

          </div>

        </section>


        {/* PAYMENT SETTINGS */}

        {paymentSettings && (

          <section className="overview-card">

            <div className="overview-header">

              <div>

                <h2>
                  Online Payment
                </h2>

                <p>
                  Hostel payment
                  information.
                </p>

              </div>

            </div>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",

                gap:
                  "12px",

                marginTop:
                  "18px",
              }}
            >

              <div>
                <small>
                  Payment Status
                </small>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",
                  }}
                >
                  {
                    paymentSettings
                      .payment_enabled
                      ? "Enabled"
                      : "Disabled"
                  }
                </strong>
              </div>


              <div>
                <small>
                  UPI ID
                </small>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",
                  }}
                >
                  {
                    paymentSettings
                      .upi_id ||
                    "—"
                  }
                </strong>
              </div>


              <div>
                <small>
                  Bank
                </small>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",
                  }}
                >
                  {
                    paymentSettings
                      .bank_name ||
                    "—"
                  }
                </strong>
              </div>


              <div>
                <small>
                  Support
                </small>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",
                  }}
                >
                  {
                    paymentSettings
                      .support_email ||
                    "—"
                  }
                </strong>
              </div>

            </div>

          </section>

        )}


        {/* FEES */}

        <section className="overview-card fees-table-card">

          <div className="overview-header">

            <div>

              <h2>
                Fee Records
              </h2>

              <p>
                Your hostel fee
                history.
              </p>

            </div>

          </div>


          {loading ? (

            <div className="empty-state">
              Loading fees...
            </div>

          ) : fees.length ===
            0 ? (

            <div className="empty-state">
              No fee records found.
            </div>

          ) : (

            <div className="fees-table-wrapper">

              <table className="fees-table my-fees-records-table">

                <thead>

                  <tr>

                    <th>
                      Fee Type
                    </th>

                    <th>
                      Room
                    </th>

                    <th>
                      Academic Year
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Due Date
                    </th>

                    <th>
                      Paid On
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Source
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {fees.map(
                    (
                      fee
                    ) => {

                    const paid =
                      String(
                        fee.status
                      )
                        .toLowerCase()
                      ===
                      "paid";


                    return (

                      <tr
                        key={
                          fee.id
                        }
                      >

                        <td>

                          <div className="my-fee-type-cell">

                            <strong>
                              {
                                fee.fee_type ||
                                "Manual Fee"
                              }
                            </strong>

                            <span>
                              Fee #{fee.id}
                            </span>

                          </div>

                        </td>


                        <td>

                          <span className="my-fee-room-badge">
                            {
                              feeRoomName(
                                fee
                              )
                            }
                          </span>

                        </td>


                        <td>
                          {
                            fee.academic_year ||
                            "—"
                          }
                        </td>


                        <td className="fee-amount">
                          {
                            formatMoney(
                              fee.amount
                            )
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              fee.due_date
                            )
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              fee.payment_date
                            )
                          }
                        </td>


                        <td>

                          <span
                            className={
                              `fee-status ${String(
                                fee.status
                              ).toLowerCase()}`
                            }
                          >
                            {
                              fee.status
                            }
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              fee.auto_generated
                                ? "my-fee-source auto"
                                : "my-fee-source manual"
                            }
                          >
                            {
                              fee.auto_generated
                                ? "AUTO GENERATED"
                                : "MANUAL"
                            }
                          </span>

                        </td>


                        <td>

                          {!paid ? (

                            <button
                              type="button"
                              className="primary-button"
                              disabled={
                                paymentProcessing ||
                                (
                                  paymentSettings &&
                                  !paymentSettings
                                    .payment_enabled
                                )
                              }
                              onClick={() =>
                                startPayment(
                                  fee
                                )
                              }
                            >
                              Pay
                            </button>

                          ) : (

                            <span className="my-fee-paid-label">
                              Paid
                            </span>

                          )}

                        </td>

                      </tr>

                    );

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* FEATURE 7 — PAYMENT HISTORY */}

        <section
          className="overview-card fees-table-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          <div className="overview-header">

            <div>

              <h2>
                Payment History & Receipts
              </h2>

              <p>
                Successful payments
                include downloadable
                PDF receipts.
              </p>

            </div>

          </div>


          {transactions.length ===
            0 ? (

            <div className="empty-state">
              No payment transactions yet.
            </div>

          ) : (

            <div className="fees-table-wrapper">

              <table className="fees-table">

                <thead>

                  <tr>
                    <th>
                      Transaction
                    </th>

                    <th>
                      Fee
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Reference
                    </th>

                    <th>
                      Receipt
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      PDF
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {transactions.map(
                    (
                      transaction
                    ) => {

                    const paid =
                      String(
                        transaction
                          .status
                      )
                        .toLowerCase()
                      ===
                      "paid";


                    return (

                      <tr
                        key={
                          transaction
                            .id
                        }
                      >

                        <td>
                          #
                          {
                            transaction
                              .id
                          }
                        </td>


                        <td>
                          #
                          {
                            transaction
                              .fee_id
                          }
                        </td>


                        <td className="fee-amount">
                          {
                            formatMoney(
                              transaction
                                .amount
                            )
                          }
                        </td>


                        <td>
                          {
                            transaction
                              .payment_method ||
                            "—"
                          }
                        </td>


                        <td>
                          {
                            transaction
                              .payment_reference ||
                            "—"
                          }
                        </td>


                        <td>
                          {
                            transaction
                              .receipt_number ||
                            "—"
                          }
                        </td>


                        <td>
                          {
                            formatDateTime(
                              transaction
                                .completed_at ||
                              transaction
                                .created_at
                            )
                          }
                        </td>


                        <td>
                          {
                            transaction
                              .status
                          }
                        </td>


                        <td>

                          {paid &&
                          transaction
                            .receipt_number ? (

                            <button
                              type="button"
                              className="primary-button"
                              disabled={
                                downloadingReceipt ===
                                transaction.id
                              }
                              onClick={() =>
                                downloadReceipt(
                                  transaction
                                )
                              }
                            >

                              {downloadingReceipt ===
                              transaction.id
                                ? "Preparing..."
                                : "↓ PDF Receipt"}

                            </button>

                          ) : (
                            "—"
                          )}

                        </td>

                      </tr>

                    );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}


export default MyFees;