import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  Html5Qrcode,
} from "html5-qrcode";

import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";

import "../components/Sidebar.css";
import "./Visitors.css";

import api from "../services/api";


const VISITOR_STATUSES = [
  "Pending",
  "Approved",
  "Expected",
  "Checked In",
  "Completed",
  "Rejected",
  "Cancelled",
];


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

  if (
    Array.isArray(
      detail
    )
  ) {
    return detail
      .map(
        (item) =>
          item?.msg ||
          "Invalid input"
      )
      .join(", ");
  }

  return fallback;
}


function localToday() {
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset()
    * 60000;

  return new Date(
    now.getTime() -
    offset
  )
    .toISOString()
    .slice(
      0,
      10
    );
}


function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${value}T00:00:00`
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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}


function formatDateTimeInput(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const hour =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );

  const minute =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
    + `T${hour}:${minute}`
  );
}


function cssValue(
  value
) {
  return String(
    value || ""
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /\//g,
      "-"
    );
}


function Visitors() {
  const role =
    decodeRole();

  const isStudent =
    role === "Student";

  const isManagement =
    role === "Admin" ||
    role === "Warden";


  const emptyForm = {
    student_id:
      "",

    visitor_name:
      "",

    relation:
      "Father",

    phone:
      "",

    purpose:
      "",

    visit_date:
      localToday(),

    check_in:
      "",

    check_out:
      "",

    status:
      "Pending",

    remarks:
      "",
  };


  const [
    visitors,
    setVisitors,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

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
  // CREATE / EDIT
  // ==========================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingVisitor,
    setEditingVisitor,
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


  // ==========================================
  // FEATURE 9 — FILTERS
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");


  // ==========================================
  // FEATURE 9 — PAGINATION
  // ==========================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);


  // ==========================================
  // QR
  // ==========================================

  const [
    expandedPassId,
    setExpandedPassId,
  ] = useState(null);


  // ==========================================
  // REVIEW
  // ==========================================

  const [
    reviewVisitorRecord,
    setReviewVisitorRecord,
  ] = useState(null);

  const [
    reviewRemarks,
    setReviewRemarks,
  ] = useState("");

  const [
    reviewing,
    setReviewing,
  ] = useState(false);


  // ==========================================
  // SCANNER
  // ==========================================

  const [
    scannerActive,
    setScannerActive,
  ] = useState(false);

  const [
    scanProcessing,
    setScanProcessing,
  ] = useState(false);

  const [
    manualCode,
    setManualCode,
  ] = useState("");

  const [
    scanResult,
    setScanResult,
  ] = useState(null);

  const scannerInstanceRef =
    useRef(null);

  const scanLockedRef =
    useRef(false);


  // ==========================================
  // LOAD
  // ==========================================

  const fetchData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          if (
            isStudent
          ) {
            const response =
              await api.get(
                "/visitors/my-visitors"
              );

            setVisitors(
              Array.isArray(
                response.data
              )
                ? response.data
                : []
            );

            setStudents([]);

          } else {

            const [
              visitorResult,
              studentResult,
            ] =
              await Promise.allSettled([
                api.get(
                  "/visitors/"
                ),

                api.get(
                  "/students/"
                ),
              ]);


            if (
              visitorResult.status ===
              "fulfilled"
            ) {
              setVisitors(
                Array.isArray(
                  visitorResult
                    .value
                    .data
                )
                  ? visitorResult
                      .value
                      .data
                  : []
              );

            } else {
              throw (
                visitorResult.reason
              );
            }


            if (
              studentResult.status ===
              "fulfilled"
            ) {
              setStudents(
                Array.isArray(
                  studentResult
                    .value
                    .data
                )
                  ? studentResult
                      .value
                      .data
                  : []
              );
            }
          }

        } catch (
          requestError
        ) {
          setVisitors([]);

          setError(
            getErrorMessage(
              requestError,
              "Unable to load visitor records."
            )
          );

        } finally {
          setLoading(false);
        }
      },
      [isStudent]
    );


  useEffect(() => {
    fetchData();
  }, [
    fetchData,
  ]);


  // ==========================================
  // QR PROCESSING
  // ==========================================

  const processQrCode =
    useCallback(
      async (
        qrCode
      ) => {
        const code =
          String(
            qrCode || ""
          ).trim();


        if (!code) {
          setError(
            "Enter or scan a valid QR pass."
          );

          scanLockedRef.current =
            false;

          return;
        }


        try {
          setScanProcessing(true);

          setError("");
          setSuccess("");

          setScanResult(null);


          const response =
            await api.post(
              "/visitors/scan-pass",
              {
                qr_code:
                  code,
              }
            );


          setScanResult(
            response.data
          );


          setSuccess(
            response.data
              ?.message ||
            "Visitor QR processed successfully."
          );


          setManualCode("");


          await fetchData();

        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to process visitor QR pass."
            )
          );

        } finally {
          setScanProcessing(false);

          scanLockedRef.current =
            false;
        }
      },
      [fetchData]
    );


  // ==========================================
  // CAMERA
  // ==========================================

  useEffect(() => {
    if (
      !scannerActive ||
      !isManagement
    ) {
      return undefined;
    }


    let disposed =
      false;


    const startCamera =
      async () => {
        try {
          const scanner =
            new Html5Qrcode(
              "visitor-qr-reader"
            );

          scannerInstanceRef.current =
            scanner;


          await scanner.start(
            {
              facingMode:
                "environment",
            },

            {
              fps:
                10,

              qrbox: {
                width:
                  240,

                height:
                  240,
              },
            },

            async (
              decodedText
            ) => {
              if (
                disposed ||
                scanLockedRef.current
              ) {
                return;
              }

              scanLockedRef.current =
                true;

              await processQrCode(
                decodedText
              );

              setScannerActive(
                false
              );
            },

            () => {}
          );

        } catch (
          cameraError
        ) {
          console.error(
            "QR scanner error:",
            cameraError
          );

          setScannerActive(
            false
          );

          setError(
            "Unable to start the camera scanner. You can enter the QR code manually instead."
          );
        }
      };


    startCamera();


    return () => {
      disposed =
        true;

      const scanner =
        scannerInstanceRef.current;

      scannerInstanceRef.current =
        null;


      if (scanner) {
        scanner
          .stop()
          .catch(
            () => {}
          )
          .finally(
            () => {
              try {
                scanner.clear();
              } catch {
                // Already cleared.
              }
            }
          );
      }
    };

  }, [
    scannerActive,
    isManagement,
    processQrCode,
  ]);


  // ==========================================
  // SUMMARY
  // ==========================================

  const summary =
    useMemo(
      () => {
        const data = {
          total:
            visitors.length,

          pending:
            0,

          approved:
            0,

          checkedIn:
            0,

          completed:
            0,
        };


        visitors.forEach(
          (
            visitor
          ) => {

            if (
              visitor.status ===
              "Pending"
            ) {
              data.pending += 1;
            }

            if (
              visitor.status ===
              "Approved"
            ) {
              data.approved += 1;
            }

            if (
              visitor.status ===
              "Checked In"
            ) {
              data.checkedIn += 1;
            }

            if (
              visitor.status ===
              "Completed"
            ) {
              data.completed += 1;
            }
          }
        );


        return data;
      },
      [visitors]
    );


  // ==========================================
  // FILTER
  // ==========================================

  const filteredVisitors =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();


        return visitors.filter(
          (
            visitor
          ) => {

            const searchable =
              [
                visitor.visitor_name,
                visitor.relation,
                visitor.phone,
                visitor.purpose,
                visitor.student_name,
                visitor.student_code,
                visitor.status,
                visitor.visit_date,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const searchMatch =
              !term ||
              searchable.includes(
                term
              );


            const statusMatch =
              statusFilter ===
                "All" ||
              visitor.status ===
                statusFilter;


            return (
              searchMatch &&
              statusMatch
            );
          }
        );
      },
      [
        visitors,
        search,
        statusFilter,
      ]
    );


  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredVisitors.length /
        pageSize
      )
    );


  const paginatedVisitors =
    useMemo(
      () => {

        const start =
          (
            currentPage - 1
          ) *
          pageSize;


        return filteredVisitors.slice(
          start,
          start + pageSize
        );
      },
      [
        filteredVisitors,
        currentPage,
        pageSize,
      ]
    );


  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
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
  // FORM
  // ==========================================

  const openAddForm =
    () => {
      setEditingVisitor(null);

      setFormData({
        ...emptyForm,

        visit_date:
          localToday(),
      });

      setShowForm(true);

      setError("");
      setSuccess("");
    };


  const openEditForm =
    (
      visitor
    ) => {
      if (
        !isManagement
      ) {
        return;
      }


      setEditingVisitor(
        visitor
      );


      setFormData({
        student_id:
          String(
            visitor.student_id ||
            ""
          ),

        visitor_name:
          visitor.visitor_name ||
          "",

        relation:
          visitor.relation ||
          "Other",

        phone:
          visitor.phone ||
          "",

        purpose:
          visitor.purpose ||
          "",

        visit_date:
          visitor.visit_date ||
          localToday(),

        check_in:
          formatDateTimeInput(
            visitor.check_in
          ),

        check_out:
          formatDateTimeInput(
            visitor.check_out
          ),

        status:
          visitor.status ||
          "Pending",

        remarks:
          visitor.remarks ||
          "",
      });


      setShowForm(true);

      setError("");
      setSuccess("");


      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };


  const closeForm =
    () => {
      setShowForm(false);

      setEditingVisitor(null);

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

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();


      if (
        !formData
          .visitor_name
          .trim()
      ) {
        setError(
          "Enter the visitor name."
        );

        return;
      }


      if (
        !formData
          .phone
          .trim()
      ) {
        setError(
          "Enter the visitor phone number."
        );

        return;
      }


      if (
        !formData
          .purpose
          .trim()
      ) {
        setError(
          "Enter the purpose of visit."
        );

        return;
      }


      if (
        !formData.visit_date
      ) {
        setError(
          "Select the visit date."
        );

        return;
      }


      try {
        setSaving(true);

        setError("");
        setSuccess("");


        if (
          isStudent
        ) {

          await api.post(
            "/visitors/my-visitor",
            {
              visitor_name:
                formData
                  .visitor_name
                  .trim(),

              relation:
                formData
                  .relation
                  .trim(),

              phone:
                formData
                  .phone
                  .trim(),

              purpose:
                formData
                  .purpose
                  .trim(),

              visit_date:
                formData.visit_date,

              remarks:
                formData
                  .remarks
                  .trim() ||
                null,
            }
          );


          setSuccess(
            "Visitor request submitted. A QR pass will appear after approval."
          );

        } else {

          if (
            !formData.student_id
          ) {
            setError(
              "Select a student."
            );

            return;
          }


          const payload = {
            student_id:
              Number(
                formData.student_id
              ),

            visitor_name:
              formData
                .visitor_name
                .trim(),

            relation:
              formData
                .relation
                .trim(),

            phone:
              formData
                .phone
                .trim(),

            purpose:
              formData
                .purpose
                .trim(),

            visit_date:
              formData.visit_date,

            check_in:
              formData.check_in ||
              null,

            check_out:
              formData.check_out ||
              null,

            status:
              formData.status,

            remarks:
              formData
                .remarks
                .trim() ||
              null,
          };


          if (
            editingVisitor
          ) {
            await api.put(
              `/visitors/${editingVisitor.id}`,
              payload
            );

            setSuccess(
              "Visitor record updated."
            );

          } else {

            await api.post(
              "/visitors/",
              payload
            );

            setSuccess(
              "Visitor record created."
            );
          }
        }


        closeForm();

        await fetchData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to save visitor record."
          )
        );

      } finally {
        setSaving(false);
      }
    };


  // ==========================================
  // STUDENT CANCEL
  // ==========================================

  const cancelMyRequest =
    async (
      visitor
    ) => {

      const confirmed =
        window.confirm(
          `Cancel visitor request for ${visitor.visitor_name}?`
        );

      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");


        await api.delete(
          `/visitors/${visitor.id}/cancel-my-request`
        );


        setSuccess(
          "Visitor request cancelled."
        );


        await fetchData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to cancel visitor request."
          )
        );
      }
    };


  // ==========================================
  // REVIEW
  // ==========================================

  const openReview =
    (
      visitor
    ) => {
      setReviewVisitorRecord(
        visitor
      );

      setReviewRemarks(
        visitor.remarks ||
        ""
      );

      setError("");
      setSuccess("");
    };


  const reviewVisitor =
    async (
      decision
    ) => {

      if (
        !reviewVisitorRecord
      ) {
        return;
      }


      try {
        setReviewing(true);

        setError("");
        setSuccess("");


        await api.put(
          `/visitors/${reviewVisitorRecord.id}/review`,
          {
            decision,

            remarks:
              reviewRemarks
                .trim() ||
              null,
          }
        );


        setSuccess(
          decision ===
            "Approved"
            ? "Visitor request approved. QR pass generated successfully."
            : "Visitor request rejected."
        );


        setReviewVisitorRecord(
          null
        );

        setReviewRemarks("");


        await fetchData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to review visitor request."
          )
        );

      } finally {
        setReviewing(false);
      }
    };


  // ==========================================
  // DELETE
  // ==========================================

  const deleteVisitor =
    async (
      visitor
    ) => {

      const confirmed =
        window.confirm(
          `Delete visitor record for ${visitor.visitor_name}?`
        );

      if (!confirmed) {
        return;
      }


      try {
        setError("");
        setSuccess("");


        await api.delete(
          `/visitors/${visitor.id}`
        );


        setSuccess(
          "Visitor record deleted."
        );


        await fetchData();

      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            "Unable to delete visitor record."
          )
        );
      }
    };


  const submitManualCode =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        scanProcessing
      ) {
        return;
      }

      await processQrCode(
        manualCode
      );
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              VISITOR MANAGEMENT
            </span>

            <h1>
              Visitors
            </h1>

            <p>

              {isStudent
                ? "Request visitor access and use secure QR visitor passes."
                : "Approve visitors, issue QR passes and manage hostel gate entry."}

            </p>

          </div>


          <div className="dashboard-date">

            <span>

              {isStudent
                ? "MY VISITORS"
                : "INSIDE HOSTEL"}

            </span>

            <strong>

              {isStudent
                ? visitors.length
                : summary.checkedIn}

            </strong>

          </div>

        </header>


        {error && (
          <div className="visitor-alert error">
            {error}
          </div>
        )}


        {success && (
          <div className="visitor-alert success">
            {success}
          </div>
        )}


        <section className="visitor-summary-grid">

          <div className="visitor-summary-card">
            <div className="visitor-summary-icon">
              ♙
            </div>

            <div>
              <span>Total</span>

              <strong>
                {summary.total}
              </strong>
            </div>
          </div>


          <div className="visitor-summary-card">
            <div className="visitor-summary-icon pending">
              ◷
            </div>

            <div>
              <span>Pending</span>

              <strong>
                {summary.pending}
              </strong>
            </div>
          </div>


          <div className="visitor-summary-card">
            <div className="visitor-summary-icon approved">
              ▣
            </div>

            <div>
              <span>Approved</span>

              <strong>
                {summary.approved}
              </strong>
            </div>
          </div>


          <div className="visitor-summary-card">
            <div className="visitor-summary-icon checked-in">
              ⇥
            </div>

            <div>
              <span>Checked In</span>

              <strong>
                {summary.checkedIn}
              </strong>
            </div>
          </div>


          <div className="visitor-summary-card">
            <div className="visitor-summary-icon completed">
              ✓
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {summary.completed}
              </strong>
            </div>
          </div>

        </section>


        {/* SCANNER */}

        {isManagement && (

          <section className="overview-card visitor-scanner-card">

            <div className="visitor-section-header">

              <div>

                <span className="visitor-eyebrow">
                  GATE ACCESS
                </span>

                <h2>
                  QR Visitor Scanner
                </h2>

                <p>
                  First scan checks in.
                  Second scan checks out.
                </p>

              </div>


              <button
                type="button"
                className={
                  scannerActive
                    ? "visitor-stop-scanner"
                    : "primary-button"
                }
                onClick={() =>
                  setScannerActive(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
              >

                {scannerActive
                  ? "Stop Scanner"
                  : "▣ Scan QR Pass"}

              </button>

            </div>


            {scannerActive && (

              <div className="visitor-camera-wrap">

                <div
                  id="visitor-qr-reader"
                  className="visitor-qr-reader"
                />

                <p>
                  Point the camera at the visitor QR pass.
                </p>

              </div>

            )}


            <form
              className="visitor-manual-scan"
              onSubmit={
                submitManualCode
              }
            >

              <div>

                <label>
                  Manual QR Code
                </label>

                <input
                  type="text"
                  placeholder="Paste or enter visitor QR token..."
                  value={
                    manualCode
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setManualCode(
                        event.target.value
                      )
                  }
                />

              </div>


              <button
                type="submit"
                disabled={
                  scanProcessing ||
                  !manualCode.trim()
                }
              >

                {scanProcessing
                  ? "Processing..."
                  : "Process Pass"}

              </button>

            </form>


            {scanResult && (

              <div
                className={
                  `visitor-scan-result ${
                    scanResult.action ===
                    "Check In"
                      ? "check-in"
                      : "check-out"
                  }`
                }
              >

                <div className="visitor-scan-result-icon">

                  {scanResult.action ===
                  "Check In"
                    ? "⇥"
                    : "⇤"}

                </div>


                <div>

                  <span>
                    {scanResult.action}
                  </span>

                  <strong>
                    {
                      scanResult
                        .visitor
                        ?.visitor_name
                    }
                  </strong>

                  <p>
                    {scanResult.message}
                  </p>

                </div>

              </div>

            )}

          </section>

        )}


        {/* CREATE */}

        <section className="overview-card visitor-create-card">

          <div className="visitor-section-header">

            <div>

              <span className="visitor-eyebrow">

                {isStudent
                  ? "VISITOR REQUEST"
                  : "VISITOR RECORD"}

              </span>

              <h2>

                {isStudent
                  ? "Request Visitor Pass"
                  : "Visitor Registration"}

              </h2>

            </div>


            <button
              type="button"
              className="primary-button"
              onClick={() => {

                if (
                  showForm
                ) {
                  closeForm();

                } else {
                  openAddForm();
                }

              }}
            >

              {showForm
                ? "Close Form"
                : isStudent
                ? "+ Request Visitor"
                : "+ Add Visitor"}

            </button>

          </div>


          {showForm && (

            <form
              className="visitor-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="visitor-form-grid">


                {!isStudent && (

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

                )}


                <label>

                  Visitor Name

                  <input
                    type="text"
                    name="visitor_name"
                    maxLength="100"
                    value={
                      formData.visitor_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </label>


                <label>

                  Relation

                  <select
                    name="relation"
                    value={
                      formData.relation
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>

                  </select>

                </label>


                <label>

                  Phone Number

                  <input
                    type="text"
                    name="phone"
                    maxLength="15"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </label>


                <label>

                  Visit Date

                  <input
                    type="date"
                    name="visit_date"
                    min={
                      isStudent
                        ? localToday()
                        : undefined
                    }
                    value={
                      formData.visit_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </label>


                {!isStudent && (

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

                      {VISITOR_STATUSES.map(
                        (
                          status
                        ) => (

                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {status}
                        </option>

                        )
                      )}

                    </select>

                  </label>

                )}


                {!isStudent && (

                  <label>

                    Check In

                    <input
                      type="datetime-local"
                      name="check_in"
                      value={
                        formData.check_in
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </label>

                )}


                {!isStudent && (

                  <label>

                    Check Out

                    <input
                      type="datetime-local"
                      name="check_out"
                      value={
                        formData.check_out
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </label>

                )}


                <label className="visitor-purpose-field">

                  Purpose of Visit

                  <input
                    type="text"
                    name="purpose"
                    maxLength="255"
                    value={
                      formData.purpose
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </label>


                <label className="visitor-remarks-field">

                  Remarks

                  <textarea
                    name="remarks"
                    rows="4"
                    maxLength="500"
                    value={
                      formData.remarks
                    }
                    onChange={
                      handleChange
                    }
                  />

                </label>

              </div>


              <div className="visitor-form-footer">

                <p>
                  Approved requests automatically receive a secure QR visitor pass.
                </p>


                <div>

                  <button
                    type="button"
                    className="visitor-secondary-button"
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
                      : isStudent
                      ? "Submit Request"
                      : editingVisitor
                      ? "Update Visitor"
                      : "Add Visitor"}

                  </button>

                </div>

              </div>

            </form>

          )}

        </section>


        {/* RECORDS */}

        <section className="overview-card visitor-record-card">

          <div className="visitor-section-header">

            <div>

              <span className="visitor-eyebrow">
                RECORDS
              </span>

              <h2>

                {isStudent
                  ? "My Visitor Passes"
                  : "Visitor Requests & Passes"}

              </h2>

              <p>
                Search, filter and manage visitor history.
              </p>

            </div>


            <span className="visitor-result-count">

              {filteredVisitors.length}
              {" "}
              {
                filteredVisitors.length ===
                1
                  ? "record"
                  : "records"
              }

            </span>

          </div>


          <div className="visitor-filter-row">

            <div className="visitor-search">

              <span>
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search visitor, student, phone or purpose..."
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

            </div>


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


              {VISITOR_STATUSES.map(
                (
                  status
                ) => (

                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>

                )
              )}

            </select>


            <button
              type="button"
              onClick={() => {
                setSearch("");

                setStatusFilter(
                  "All"
                );
              }}
            >
              Clear
            </button>

          </div>


          {loading ? (

            <div className="visitor-empty">

              <span>♙</span>

              <strong>
                Loading visitor records...
              </strong>

            </div>

          ) : filteredVisitors.length ===
            0 ? (

            <div className="visitor-empty">

              <span>▣</span>

              <strong>
                No matching visitor records
              </strong>

              <p>
                Try changing your search or status filter.
              </p>

            </div>

          ) : (

            <>

              <div className="visitor-list">

                {paginatedVisitors.map(
                  (
                    visitor
                  ) => {

                  const passExpanded =
                    expandedPassId ===
                    visitor.id;


                  return (

                    <article
                      className="visitor-record"
                      key={
                        visitor.id
                      }
                    >

                      <div className="visitor-record-header">

                        <div className="visitor-avatar">

                          {
                            visitor
                              .visitor_name
                              ?.charAt(0)
                              ?.toUpperCase()
                            ||
                            "V"
                          }

                        </div>


                        <div className="visitor-record-main">

                          <span className="visitor-record-id">
                            VISITOR #{visitor.id}
                          </span>

                          <h3>
                            {visitor.visitor_name}
                          </h3>

                          <p>
                            {visitor.relation}
                            {" · "}
                            {visitor.phone}
                          </p>

                        </div>


                        <span
                          className={
                            `visitor-status status-${cssValue(
                              visitor.status
                            )}`
                          }
                        >
                          {visitor.status}
                        </span>

                      </div>


                      <div className="visitor-record-details">

                        {isManagement && (

                          <div>

                            <span>
                              STUDENT
                            </span>

                            <strong>
                              {
                                visitor.student_name ||
                                `Student #${visitor.student_id}`
                              }
                            </strong>

                            <small>
                              {
                                visitor.student_code ||
                                ""
                              }
                            </small>

                          </div>

                        )}


                        <div>

                          <span>
                            VISIT DATE
                          </span>

                          <strong>
                            {
                              formatDate(
                                visitor.visit_date
                              )
                            }
                          </strong>

                        </div>


                        <div>

                          <span>
                            PURPOSE
                          </span>

                          <strong>
                            {visitor.purpose}
                          </strong>

                        </div>


                        <div>

                          <span>
                            CHECK IN
                          </span>

                          <strong>
                            {
                              formatDateTime(
                                visitor.check_in
                              )
                            }
                          </strong>

                        </div>


                        <div>

                          <span>
                            CHECK OUT
                          </span>

                          <strong>
                            {
                              formatDateTime(
                                visitor.check_out
                              )
                            }
                          </strong>

                        </div>

                      </div>


                      {visitor.remarks && (

                        <div className="visitor-remarks">

                          <span>
                            REMARKS
                          </span>

                          <p>
                            {visitor.remarks}
                          </p>

                        </div>

                      )}


                      {isStudent &&
                        visitor.pass_available &&
                        visitor.qr_code && (

                        <div className="visitor-pass-section">

                          <button
                            type="button"
                            className="visitor-show-pass"
                            onClick={() =>
                              setExpandedPassId(
                                passExpanded
                                  ? null
                                  : visitor.id
                              )
                            }
                          >

                            <span>▣</span>

                            {passExpanded
                              ? "Hide QR Pass"
                              : "Show QR Pass"}

                          </button>


                          {passExpanded && (

                            <div className="visitor-qr-pass">

                              <div className="visitor-pass-top">

                                <div>

                                  <span>
                                    HOSTELHUB
                                  </span>

                                  <strong>
                                    Visitor Pass
                                  </strong>

                                </div>


                                <span
                                  className={
                                    `visitor-pass-status ${
                                      visitor.status ===
                                      "Checked In"
                                        ? "inside"
                                        : ""
                                    }`
                                  }
                                >

                                  {visitor.status ===
                                  "Checked In"
                                    ? "Inside Hostel"
                                    : "Valid Pass"}

                                </span>

                              </div>


                              <div className="visitor-pass-body">

                                <div className="visitor-pass-qr">

                                  <QRCodeSVG
                                    value={
                                      visitor.qr_code
                                    }
                                    size={180}
                                    level="H"
                                    marginSize={2}
                                  />

                                </div>


                                <div className="visitor-pass-info">

                                  <span>VISITOR</span>

                                  <strong>
                                    {visitor.visitor_name}
                                  </strong>


                                  <span>RELATION</span>

                                  <strong>
                                    {visitor.relation}
                                  </strong>


                                  <span>
                                    VISIT DATE
                                  </span>

                                  <strong>
                                    {
                                      formatDate(
                                        visitor.visit_date
                                      )
                                    }
                                  </strong>


                                  <span>PURPOSE</span>

                                  <strong>
                                    {visitor.purpose}
                                  </strong>

                                </div>

                              </div>


                              <div className="visitor-pass-footer">

                                <span>▣</span>

                                <p>
                                  Show this QR at the hostel gate.
                                </p>

                              </div>

                            </div>

                          )}

                        </div>

                      )}


                      <div className="visitor-record-actions">

                        {isStudent &&
                          (
                            visitor.status ===
                              "Pending" ||
                            visitor.status ===
                              "Approved"
                          ) &&
                          !visitor.check_in && (

                          <button
                            type="button"
                            className="visitor-cancel-button"
                            onClick={() =>
                              cancelMyRequest(
                                visitor
                              )
                            }
                          >
                            Cancel Request
                          </button>

                        )}


                        {isManagement &&
                          (
                            visitor.status ===
                              "Pending" ||
                            visitor.status ===
                              "Expected"
                          ) && (

                          <button
                            type="button"
                            className="visitor-review-button"
                            onClick={() =>
                              openReview(
                                visitor
                              )
                            }
                          >
                            Review Request
                          </button>

                        )}


                        {isManagement && (

                          <button
                            type="button"
                            className="visitor-edit-button"
                            onClick={() =>
                              openEditForm(
                                visitor
                              )
                            }
                          >
                            Edit
                          </button>

                        )}


                        {isManagement &&
                          visitor.status !==
                            "Checked In" && (

                          <button
                            type="button"
                            className="visitor-delete-button"
                            onClick={() =>
                              deleteVisitor(
                                visitor
                              )
                            }
                          >
                            Delete
                          </button>

                        )}

                      </div>

                    </article>

                  );
                  }
                )}

              </div>


              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={
                  filteredVisitors.length
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


        {/* REVIEW */}

        {isManagement &&
          reviewVisitorRecord && (

          <section className="overview-card visitor-review-card">

            <div className="visitor-review-header">

              <div>

                <span className="visitor-eyebrow">
                  REVIEW VISITOR
                </span>

                <h2>
                  {
                    reviewVisitorRecord.visitor_name
                  }
                </h2>

                <p>
                  Requested by{" "}
                  {
                    reviewVisitorRecord.student_name ||
                    `Student #${reviewVisitorRecord.student_id}`
                  }
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setReviewVisitorRecord(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="visitor-review-details">

              <div>
                <span>RELATION</span>

                <strong>
                  {
                    reviewVisitorRecord.relation
                  }
                </strong>
              </div>


              <div>
                <span>PHONE</span>

                <strong>
                  {
                    reviewVisitorRecord.phone
                  }
                </strong>
              </div>


              <div>
                <span>DATE</span>

                <strong>
                  {
                    formatDate(
                      reviewVisitorRecord.visit_date
                    )
                  }
                </strong>
              </div>


              <div>
                <span>PURPOSE</span>

                <strong>
                  {
                    reviewVisitorRecord.purpose
                  }
                </strong>
              </div>

            </div>


            <label className="visitor-review-note">

              Review Note

              <textarea
                rows="4"
                maxLength="500"
                value={
                  reviewRemarks
                }
                onChange={
                  (
                    event
                  ) =>
                    setReviewRemarks(
                      event.target.value
                    )
                }
              />

            </label>


            <div className="visitor-review-actions">

              <button
                type="button"
                className="visitor-reject-button"
                disabled={
                  reviewing
                }
                onClick={() =>
                  reviewVisitor(
                    "Rejected"
                  )
                }
              >
                Reject
              </button>


              <button
                type="button"
                className="primary-button"
                disabled={
                  reviewing
                }
                onClick={() =>
                  reviewVisitor(
                    "Approved"
                  )
                }
              >

                {reviewing
                  ? "Processing..."
                  : "Approve & Generate QR"}

              </button>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}


export default Visitors;