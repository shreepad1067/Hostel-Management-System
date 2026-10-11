import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";

import "../components/Sidebar.css";
import "./Fees.css";

import api from "../services/api";


function decodeRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    let payload =
      token.split(".")[1];

    payload =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    while (
      payload.length % 4
    ) {
      payload += "=";
    }

    return JSON.parse(
      atob(payload)
    ).role;

  } catch {
    return null;
  }
}


function formatMoney(
  value
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
    new Date(value);

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


function Fees() {
  const role =
    decodeRole();

  const isAdmin =
    role === "Admin";


  const emptyForm = {
    student_id: "",
    amount: "",
    due_date: "",
    payment_date: "",
    status: "Pending",
    payment_method: "",
    description: "",
  };


  const [
    fees,
    setFees,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    rooms,
    setRooms,
  ] = useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    paymentSettings,
    setPaymentSettings,
  ] = useState({
    payment_enabled: true,
    account_holder_name: "",
    bank_name: "",
    account_last4: "",
    ifsc_code: "",
    upi_id: "",
    support_email: "",
    failure_message: "",
  });

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


  // ==========================================
  // FORM
  // ==========================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingFee,
    setEditingFee,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(
    emptyForm
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    savingSettings,
    setSavingSettings,
  ] = useState(false);

  const [
    downloadingReceipt,
    setDownloadingReceipt,
  ] = useState(null);


  // ==========================================
  // FEATURE 9 — FEE FILTERS
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    studentFilter,
    setStudentFilter,
  ] = useState("All");

  const [
    paymentMethodFilter,
    setPaymentMethodFilter,
  ] = useState("All");

  const [
    sortBy,
    setSortBy,
  ] = useState("newest");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);


  // ==========================================
  // TRANSACTION PAGINATION
  // ==========================================

  const [
    transactionPage,
    setTransactionPage,
  ] = useState(1);

  const [
    transactionPageSize,
    setTransactionPageSize,
  ] = useState(10);

  const [
    transactionSearch,
    setTransactionSearch,
  ] = useState("");

  const [
    transactionStatusFilter,
    setTransactionStatusFilter,
  ] = useState("All");


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
            studentsResult,
            roomsResult,
            settingsResult,
            transactionResult,
          ] =
            await Promise.allSettled([
              api.get(
                "/fees/"
              ),

              api.get(
                "/students/"
              ),

              api.get(
                "/rooms/"
              ),

              api.get(
                "/fees/payment-settings"
              ),

              api.get(
                "/fees/payment-transactions"
              ),
            ]);


          if (
            feesResult.status ===
            "fulfilled"
          ) {
            setFees(
              Array.isArray(
                feesResult.value.data
              )
                ? feesResult.value.data
                : []
            );

          } else {
            throw feesResult.reason;
          }


          if (
            studentsResult.status ===
            "fulfilled"
          ) {
            setStudents(
              Array.isArray(
                studentsResult.value.data
              )
                ? studentsResult.value.data
                : []
            );
          }


          if (
            roomsResult.status ===
            "fulfilled"
          ) {
            setRooms(
              Array.isArray(
                roomsResult.value.data
              )
                ? roomsResult.value.data
                : []
            );
          }


          if (
            settingsResult.status ===
            "fulfilled"
          ) {
            setPaymentSettings(
              (
                previous
              ) => ({
                ...previous,
                ...settingsResult.value.data,
              })
            );
          }


          if (
            transactionResult.status ===
            "fulfilled"
          ) {
            setTransactions(
              Array.isArray(
                transactionResult.value.data
              )
                ? transactionResult.value.data
                : []
            );
          }

        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load fees."
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
  // STUDENT NAME
  // ==========================================

  const studentName =
    (
      studentId
    ) => {

      const student =
        students.find(
          (
            item
          ) =>
            Number(item.id) ===
            Number(studentId)
        );


      if (!student) {
        return (
          `Student #${studentId}`
        );
      }


      return (
        student.name
        +
        (
          student.student_code
            ? ` (${student.student_code})`
            : ""
        )
      );
    };


  // ==========================================
  // ROOM NAME
  // ==========================================

  const roomName =
    (
      roomId
    ) => {

      if (!roomId) {
        return "—";
      }

      const room =
        rooms.find(
          (
            item
          ) =>
            Number(item.id) ===
            Number(roomId)
        );

      if (!room) {
        return `Room #${roomId}`;
      }

      return (
        room.room_number ||
        `Room #${roomId}`
      );
    };


  // ==========================================
  // SUMMARY
  // ==========================================

  const summary =
    useMemo(
      () => {
        let total = 0;
        let paid = 0;
        let pending = 0;


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
  // PAYMENT METHODS
  // ==========================================

  const paymentMethods =
    useMemo(
      () =>
        [
          ...new Set(
            fees
              .map(
                (
                  fee
                ) =>
                  fee.payment_method
              )
              .filter(Boolean)
          ),
        ].sort(),
      [fees]
    );


  // ==========================================
  // FEATURE 9 — FILTER FEES
  // ==========================================

  const filteredFees =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        const result =
          fees.filter(
            (
              fee
            ) => {

              const student =
                studentName(
                  fee.student_id
                );


              const searchable =
                [
                  fee.id,
                  fee.description,
                  fee.amount,
                  fee.due_date,
                  fee.payment_date,
                  fee.payment_method,
                  fee.status,
                  student,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              const matchesSearch =
                !term ||
                searchable.includes(
                  term
                );


              const matchesStatus =
                statusFilter ===
                  "All" ||
                fee.status ===
                  statusFilter;


              const matchesStudent =
                studentFilter ===
                  "All" ||
                String(
                  fee.student_id
                ) ===
                  String(
                    studentFilter
                  );


              const matchesMethod =
                paymentMethodFilter ===
                  "All" ||
                fee.payment_method ===
                  paymentMethodFilter;


              return (
                matchesSearch &&
                matchesStatus &&
                matchesStudent &&
                matchesMethod
              );
            }
          );


        return [
          ...result,
        ].sort(
          (
            first,
            second
          ) => {

            switch (
              sortBy
            ) {

              case "oldest":
                return (
                  Number(first.id) -
                  Number(second.id)
                );


              case "amount-low":
                return (
                  Number(first.amount) -
                  Number(second.amount)
                );


              case "amount-high":
                return (
                  Number(second.amount) -
                  Number(first.amount)
                );


              case "due-soon":
                return (
                  new Date(
                    first.due_date || 0
                  ) -
                  new Date(
                    second.due_date || 0
                  )
                );


              case "newest":
              default:
                return (
                  Number(second.id) -
                  Number(first.id)
                );
            }
          }
        );
      },
      [
        fees,
        search,
        statusFilter,
        studentFilter,
        paymentMethodFilter,
        sortBy,
        students,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredFees.length /
        pageSize
      )
    );


  const paginatedFees =
    useMemo(
      () => {

        const start =
          (
            currentPage - 1
          ) *
          pageSize;


        return filteredFees.slice(
          start,
          start + pageSize
        );
      },
      [
        filteredFees,
        currentPage,
        pageSize,
      ]
    );


  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    studentFilter,
    paymentMethodFilter,
    sortBy,
    pageSize,
  ]);


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  // ==========================================
  // TRANSACTION FILTERS
  // ==========================================

  const filteredTransactions =
    useMemo(
      () => {

        const term =
          transactionSearch
            .trim()
            .toLowerCase();


        return transactions.filter(
          (
            transaction
          ) => {

            const searchable =
              [
                transaction.id,
                transaction.fee_id,
                transaction.amount,
                transaction.payment_method,
                transaction.payment_reference,
                transaction.receipt_number,
                transaction.status,
                studentName(
                  transaction.student_id
                ),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
              !term ||
              searchable.includes(
                term
              );


            const matchesStatus =
              transactionStatusFilter ===
                "All" ||
              transaction.status ===
                transactionStatusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );
      },
      [
        transactions,
        transactionSearch,
        transactionStatusFilter,
        students,
      ]
    );


  const transactionTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTransactions.length /
        transactionPageSize
      )
    );


  const paginatedTransactions =
    useMemo(
      () => {

        const start =
          (
            transactionPage - 1
          ) *
          transactionPageSize;


        return filteredTransactions.slice(
          start,
          start +
            transactionPageSize
        );
      },
      [
        filteredTransactions,
        transactionPage,
        transactionPageSize,
      ]
    );


  useEffect(() => {
    setTransactionPage(1);
  }, [
    transactionSearch,
    transactionStatusFilter,
    transactionPageSize,
  ]);


  // ==========================================
  // FORM
  // ==========================================

  const openAddForm =
    () => {
      setEditingFee(null);

      setFormData(
        emptyForm
      );

      setShowForm(true);
    };


  const openEditForm =
    (
      fee
    ) => {

      setEditingFee(
        fee
      );


      setFormData({
        student_id:
          String(
            fee.student_id
          ),

        amount:
          fee.amount ?? "",

        due_date:
          fee.due_date ?? "",

        payment_date:
          fee.payment_date ?? "",

        status:
          fee.status ||
          "Pending",

        payment_method:
          fee.payment_method ||
          "",

        description:
          fee.description ||
          "",
      });


      setShowForm(true);
    };


  const closeForm =
    () => {
      setShowForm(false);

      setEditingFee(null);

      setFormData(
        emptyForm
      );
    };


  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
      } =
        event.target;


      setFormData(
        (
          previous
        ) => ({
          ...previous,
          [name]:
            value,
        })
      );
    };


  // ==========================================
  // SAVE
  // ==========================================

  const saveFee =
    async (
      event
    ) => {

      event.preventDefault();


      if (!isAdmin) {
        return;
      }


      try {
        setSaving(true);

        setError("");
        setSuccess("");


        const payload = {
          student_id:
            Number(
              formData.student_id
            ),

          amount:
            Number(
              formData.amount
            ),

          due_date:
            formData.due_date ||
            null,

          payment_date:
            formData.payment_date ||
            null,

          status:
            formData.status,

          payment_method:
            formData.payment_method
              .trim() ||
            null,

          description:
            formData.description
              .trim() ||
            null,
        };


        if (
          editingFee
        ) {
          await api.put(
            `/fees/${editingFee.id}`,
            payload
          );

          setSuccess(
            "Fee record updated."
          );

        } else {
          await api.post(
            "/fees/",
            payload
          );

          setSuccess(
            "Fee record created."
          );
        }


        closeForm();

        await loadData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to save fee."
          )
        );

      } finally {
        setSaving(false);
      }
    };


  // ==========================================
  // DELETE
  // ==========================================

  const deleteFee =
    async (
      fee
    ) => {

      if (!isAdmin) {
        return;
      }


      const confirmed =
        window.confirm(
          `Delete fee #${fee.id}?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");


        await api.delete(
          `/fees/${fee.id}`
        );


        setSuccess(
          "Fee record deleted."
        );


        await loadData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to delete fee."
          )
        );
      }
    };


  // ==========================================
  // PAYMENT SETTINGS
  // ==========================================

  const updateSetting =
    (
      event
    ) => {

      const {
        name,
        value,
        type,
        checked,
      } =
        event.target;


      setPaymentSettings(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };


  const savePaymentSettings =
    async (
      event
    ) => {

      event.preventDefault();


      if (!isAdmin) {
        return;
      }


      try {
        setSavingSettings(true);

        setError("");
        setSuccess("");


        await api.put(
          "/fees/payment-settings",
          paymentSettings
        );


        setSuccess(
          "Payment settings updated."
        );


        await loadData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to save payment settings."
          )
        );

      } finally {
        setSavingSettings(false);
      }
    };


  // ==========================================
  // FEATURE 7 — PDF
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
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.download =
          `${transaction.receipt_number || `receipt-${transaction.id}`}.pdf`;


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        window.URL.revokeObjectURL(
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


  const clearFeeFilters =
    () => {
      setSearch("");
      setStatusFilter("All");
      setStudentFilter("All");
      setPaymentMethodFilter("All");
      setSortBy("newest");
    };


  return (
    <div className="dashboard-layout fees-page">

      <Sidebar />


      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              FINANCE
            </span>

            <h1>
              Fees
            </h1>

            <p>
              Manage hostel fees,
              payments and receipts.
            </p>

          </div>


          <div className="dashboard-date">

            <span>
              TOTAL FEES
            </span>

            <strong>
              {fees.length}
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
            <span>Total</span>

            <strong>
              {
                formatMoney(
                  summary.total
                )
              }
            </strong>
          </div>


          <div className="fees-summary-card">
            <span>Paid</span>

            <strong>
              {
                formatMoney(
                  summary.paid
                )
              }
            </strong>
          </div>


          <div className="fees-summary-card">
            <span>Pending</span>

            <strong>
              {
                formatMoney(
                  summary.pending
                )
              }
            </strong>
          </div>

        </section>


        {/* MANAGEMENT */}

        <section className="overview-card">

          <div className="overview-header">

            <div>

              <h2>
                Fee Management
              </h2>

              <p>
                Search and manage student
                fee records.
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
                  : "+ Add Fee"}

              </button>

            )}

          </div>


          {isAdmin &&
          showForm && (

            <form
              onSubmit={
                saveFee
              }
              style={{
                marginTop:
                  "20px",
              }}
            >

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",

                  gap:
                    "14px",
                }}
              >

                <label>
                  Student

                  <select
                    name="student_id"
                    value={
                      formData.student_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select student
                    </option>


                    {students.map(
                      (
                        student
                      ) => (

                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {student.name}

                        {student.student_code
                          ? ` — ${student.student_code}`
                          : ""}
                      </option>

                      )
                    )}

                  </select>
                </label>


                <label>
                  Amount

                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>


                <label>
                  Due Date

                  <input
                    name="due_date"
                    type="date"
                    value={
                      formData.due_date
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>


                <label>
                  Payment Date

                  <input
                    name="payment_date"
                    type="date"
                    value={
                      formData.payment_date
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>


                <label>
                  Status

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Paid">
                      Paid
                    </option>
                  </select>
                </label>


                <label>
                  Payment Method

                  <select
                    name="payment_method"
                    value={
                      formData.payment_method
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Select
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

                    <option value="Online Demo">
                      Online Demo
                    </option>
                  </select>

                </label>

              </div>


              <label
                style={{
                  display:
                    "block",

                  marginTop:
                    "14px",
                }}
              >
                Description

                <input
                  name="description"
                  type="text"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  marginTop:
                    "16px",
                }}
              >

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingFee
                    ? "Update Fee"
                    : "Create Fee"}

                </button>

              </div>

            </form>

          )}

        </section>


        {/* ADVANCED FILTERS */}

        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          <div className="overview-header">

            <div>
              <h2>
                Advanced Fee Search
              </h2>

              <p>
                Search and filter fee records.
              </p>
            </div>


            <strong>
              {
                filteredFees.length
              }
              {" "}
              records
            </strong>

          </div>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(250px, 2fr) repeat(4, minmax(140px, 1fr)) auto",

              gap:
                "10px",

              marginTop:
                "18px",
            }}
          >

            <input
              type="search"
              placeholder="Search fee, student, amount, method..."
              value={
                search
              }
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
              }
            />


            <select
              value={
                statusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStatusFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Paid">
                Paid
              </option>
            </select>


            <select
              value={
                studentFilter
              }
              onChange={
                (
                  event
                ) =>
                  setStudentFilter(
                    event.target.value
                  )
              }
            >

              <option value="All">
                All Students
              </option>


              {students.map(
                (
                  student
                ) => (

                <option
                  key={
                    student.id
                  }
                  value={
                    student.id
                  }
                >
                  {student.name}
                </option>

                )
              )}

            </select>


            <select
              value={
                paymentMethodFilter
              }
              onChange={
                (
                  event
                ) =>
                  setPaymentMethodFilter(
                    event.target.value
                  )
              }
            >

              <option value="All">
                All Methods
              </option>


              {paymentMethods.map(
                (
                  method
                ) => (

                <option
                  key={method}
                  value={method}
                >
                  {method}
                </option>

                )
              )}

            </select>


            <select
              value={
                sortBy
              }
              onChange={
                (
                  event
                ) =>
                  setSortBy(
                    event.target.value
                  )
              }
            >
              <option value="newest">
                Newest
              </option>

              <option value="oldest">
                Oldest
              </option>

              <option value="amount-high">
                Amount High–Low
              </option>

              <option value="amount-low">
                Amount Low–High
              </option>

              <option value="due-soon">
                Due Date
              </option>
            </select>


            <button
              type="button"
              onClick={
                clearFeeFilters
              }
            >
              Clear
            </button>

          </div>

        </section>


        {/* FEE TABLE */}

        <section
          className="overview-card fees-table-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          {loading ? (

            <div className="empty-state">
              Loading fees...
            </div>

          ) : filteredFees.length ===
            0 ? (

            <div className="empty-state">
              No matching fee records.
            </div>

          ) : (

            <>

              <div className="fees-table-wrapper">

                <table className="fees-table fees-records-table">

                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Fee Type</th>
                      <th>Room</th>
                      <th>Academic Year</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Paid On</th>
                      <th>Status</th>
                      <th>Source</th>

                      {isAdmin && (
                        <th>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>


                  <tbody>

                    {paginatedFees.map(
                      (
                        fee
                      ) => (

                      <tr
                        key={
                          fee.id
                        }
                      >

                        <td>
                          <div className="fee-student-cell">

                            <strong>
                              {
                                studentName(
                                  fee.student_id
                                )
                              }
                            </strong>

                            <span>
                              Fee #{fee.id}
                            </span>

                          </div>
                        </td>


                        <td>
                          <div className="fee-type-cell">

                            <strong>
                              {
                                fee.fee_type ||
                                "Manual Fee"
                              }
                            </strong>

                            {
                              fee.description && (
                                <span>
                                  {fee.description}
                                </span>
                              )
                            }

                          </div>
                        </td>


                        <td>
                          <span className="fee-room-badge">
                            {
                              roomName(
                                fee.room_id
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
                            {fee.status}
                          </span>
                        </td>


                        <td>
                          <span
                            className={
                              fee.auto_generated
                                ? "fee-source-badge auto"
                                : "fee-source-badge manual"
                            }
                          >
                            {
                              fee.auto_generated
                                ? "AUTO GENERATED"
                                : "MANUAL"
                            }
                          </span>
                        </td>


                        {isAdmin && (

                          <td>

                            <div className="fee-action-buttons">

                              <button
                                type="button"
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
                                onClick={() =>
                                  deleteFee(
                                    fee
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


              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={
                  filteredFees.length
                }
                pageSize={
                  pageSize
                }
                onPageChange={
                  setCurrentPage
                }
                onPageSizeChange={
                  setPageSize
                }
              />

            </>

          )}

        </section>


        {/* PAYMENT SETTINGS */}

        <section
          className="overview-card"
          style={{
            marginTop:
              "22px",
          }}
        >

          <div className="overview-header">

            <div>
              <h2>
                Payment Settings
              </h2>

              <p>
                Hostel online payment configuration.
              </p>
            </div>

          </div>


          <form
            onSubmit={
              savePaymentSettings
            }
            style={{
              marginTop:
                "18px",
            }}
          >

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",

                gap:
                  "14px",
              }}
            >

              <label>

                Payment Enabled

                <input
                  type="checkbox"
                  name="payment_enabled"
                  checked={
                    Boolean(
                      paymentSettings.payment_enabled
                    )
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />

              </label>


              <label>
                Account Holder

                <input
                  name="account_holder_name"
                  value={
                    paymentSettings.account_holder_name ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>


              <label>
                Bank

                <input
                  name="bank_name"
                  value={
                    paymentSettings.bank_name ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>


              <label>
                Account Last 4

                <input
                  name="account_last4"
                  value={
                    paymentSettings.account_last4 ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>


              <label>
                IFSC

                <input
                  name="ifsc_code"
                  value={
                    paymentSettings.ifsc_code ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>


              <label>
                UPI ID

                <input
                  name="upi_id"
                  value={
                    paymentSettings.upi_id ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>


              <label>
                Support Email

                <input
                  name="support_email"
                  value={
                    paymentSettings.support_email ||
                    ""
                  }
                  disabled={
                    !isAdmin
                  }
                  onChange={
                    updateSetting
                  }
                />
              </label>

            </div>


            {isAdmin && (

              <button
                type="submit"
                className="primary-button"
                disabled={
                  savingSettings
                }
                style={{
                  marginTop:
                    "16px",
                }}
              >

                {savingSettings
                  ? "Saving..."
                  : "Save Payment Settings"}

              </button>

            )}

          </form>

        </section>


        {/* TRANSACTIONS */}

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
                Payment Transactions
              </h2>

              <p>
                Search transactions and
                download PDF receipts.
              </p>

            </div>

          </div>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(250px, 1fr) 180px",

              gap:
                "10px",

              margin:
                "18px 0",
            }}
          >

            <input
              type="search"
              placeholder="Search reference, receipt, student..."
              value={
                transactionSearch
              }
              onChange={
                (
                  event
                ) =>
                  setTransactionSearch(
                    event.target.value
                  )
              }
            />


            <select
              value={
                transactionStatusFilter
              }
              onChange={
                (
                  event
                ) =>
                  setTransactionStatusFilter(
                    event.target.value
                  )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Failed">
                Failed
              </option>
            </select>

          </div>


          {filteredTransactions.length ===
            0 ? (

            <div className="empty-state">
              No matching payment transactions.
            </div>

          ) : (

            <>

              <div className="fees-table-wrapper">

                <table className="fees-table">

                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Student</th>
                      <th>Fee</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Receipt</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>PDF</th>
                    </tr>
                  </thead>


                  <tbody>

                    {paginatedTransactions.map(
                      (
                        transaction
                      ) => {

                      const paid =
                        String(
                          transaction.status
                        )
                          .toLowerCase()
                        ===
                        "paid";


                      return (

                        <tr
                          key={
                            transaction.id
                          }
                        >
                          <td>
                            #{transaction.id}
                          </td>

                          <td>
                            {
                              studentName(
                                transaction.student_id
                              )
                            }
                          </td>

                          <td>
                            #{transaction.fee_id}
                          </td>

                          <td className="fee-amount">
                            {
                              formatMoney(
                                transaction.amount
                              )
                            }
                          </td>

                          <td>
                            {
                              transaction.payment_method ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              transaction.payment_reference ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              transaction.receipt_number ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              formatDateTime(
                                transaction.completed_at ||
                                transaction.created_at
                              )
                            }
                          </td>

                          <td>
                            {transaction.status}
                          </td>

                          <td>

                            {paid &&
                            transaction.receipt_number ? (

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
                                  : "↓ PDF"}

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


              <Pagination
                currentPage={
                  transactionPage
                }
                totalPages={
                  transactionTotalPages
                }
                totalItems={
                  filteredTransactions.length
                }
                pageSize={
                  transactionPageSize
                }
                onPageChange={
                  setTransactionPage
                }
                onPageSizeChange={
                  setTransactionPageSize
                }
              />

            </>

          )}

        </section>

      </main>

    </div>
  );
}


export default Fees;