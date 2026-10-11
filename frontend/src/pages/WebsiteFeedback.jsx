import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./WebsiteFeedback.css";

import api from "../services/api";


function roleFromToken() {
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


function WebsiteFeedback() {
  const role =
    roleFromToken();

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState({
    category:
      "Suggestion",

    rating:
      5,

    message:
      "",
  });


  // =====================================================
  // LOAD FEEDBACK
  // =====================================================

  const load =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setLoadError("");

          const endpoint =
            role === "Admin"
              ? "/website-feedback/records"
              : "/website-feedback/my-feedback";

          const response =
            await api.get(
              endpoint
            );

          const data =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          setRecords(
            data
          );

        } catch (error) {
          console.error(
            "Website feedback load error:",
            error
          );

          setRecords([]);

          setLoadError(
            error.response
              ?.data
              ?.detail
            ||
            "Feedback information is temporarily unavailable."
          );

        } finally {
          setLoading(false);
        }
      },
      [role]
    );


  useEffect(() => {
    if (
      role === "Admin" ||
      role === "Student"
    ) {
      load();
    }
  }, [
    load,
    role,
  ]);


  // =====================================================
  // STUDENT SUBMIT
  // =====================================================

  const submit =
    async (
      event
    ) => {
      event.preventDefault();

      try {
        setActionError("");
        setSuccess("");

        await api.post(
          "/website-feedback/",
          {
            category:
              form.category,

            rating:
              Number(
                form.rating
              ),

            message:
              form.message.trim(),
          }
        );

        setSuccess(
          "Thank you. Your feedback has been submitted successfully."
        );

        setForm({
          category:
            "Suggestion",

          rating:
            5,

          message:
            "",
        });

        await load();

      } catch (error) {
        setActionError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to submit feedback right now."
        );
      }
    };


  // =====================================================
  // ADMIN STATUS UPDATE
  // =====================================================

  const changeStatus =
    async (
      record,
      newStatus
    ) => {
      try {
        setActionError("");
        setSuccess("");

        await api.put(
          `/website-feedback/${record.id}`,
          {
            status:
              newStatus,

            admin_note:
              record.admin_note
              || null,
          }
        );

        setSuccess(
          "Feedback status updated."
        );

        await load();

      } catch (error) {
        setActionError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to update feedback."
        );
      }
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              HOSTELHUB EXPERIENCE
            </span>

            <h1>
              Website Feedback
            </h1>

            <p>
              {role === "Admin"
                ? "Review student suggestions and issues."
                : "Help us improve HostelHub."}
            </p>

          </div>

        </header>


        {/* =================================================
            ACTION MESSAGES
        ================================================= */}

        {actionError && (
          <div className="website-feedback-alert error">
            {actionError}
          </div>
        )}


        {success && (
          <div className="website-feedback-alert success">
            {success}
          </div>
        )}


        {/* =================================================
            STUDENT SUBMISSION FORM
        ================================================= */}

        {role === "Student" && (

          <section className="overview-card">

            <div className="website-feedback-section-header">

              <div>

                <h2>
                  Send Feedback
                </h2>

                <p>
                  Share suggestions, bugs,
                  design issues or other
                  feedback about HostelHub.
                </p>

              </div>

            </div>


            <form
              className="website-feedback-form"
              onSubmit={
                submit
              }
            >

              <div className="website-feedback-grid">

                <label>

                  Category

                  <select
                    value={
                      form.category
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setForm({
                          ...form,

                          category:
                            event
                              .target
                              .value,
                        })
                    }
                  >

                    <option value="Suggestion">
                      Suggestion
                    </option>

                    <option value="Bug">
                      Bug
                    </option>

                    <option value="Design">
                      Design
                    </option>

                    <option value="Performance">
                      Performance
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </label>


                <label>

                  Rating

                  <select
                    value={
                      form.rating
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setForm({
                          ...form,

                          rating:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                    }
                  >

                    <option value="5">
                      5 - Excellent
                    </option>

                    <option value="4">
                      4 - Good
                    </option>

                    <option value="3">
                      3 - Average
                    </option>

                    <option value="2">
                      2 - Poor
                    </option>

                    <option value="1">
                      1 - Very Poor
                    </option>

                  </select>

                </label>

              </div>


              <label className="website-feedback-message">

                Message

                <textarea
                  required
                  minLength="5"
                  maxLength="1500"
                  rows="5"
                  placeholder="Tell us what you would like to improve..."
                  value={
                    form.message
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setForm({
                        ...form,

                        message:
                          event
                            .target
                            .value,
                      })
                  }
                />

              </label>


              <button
                type="submit"
                className="primary-button"
              >
                Submit Feedback
              </button>

            </form>

          </section>

        )}


        {/* =================================================
            FEEDBACK LIST
        ================================================= */}

        <section
          className="overview-card website-feedback-list-card"
        >

          <div className="website-feedback-section-header">

            <div>

              <h2>
                {role === "Admin"
                  ? "Student Feedback"
                  : "My Feedback"}
              </h2>

              <p>
                {role === "Admin"
                  ? "Feedback submitted by HostelHub students."
                  : "Feedback you have submitted to HostelHub."}
              </p>

            </div>


            {!loading &&
              !loadError &&
              records.length > 0 && (

              <span className="website-feedback-count">
                {records.length}
                {" "}
                {records.length === 1
                  ? "record"
                  : "records"}
              </span>

            )}

          </div>


          {/* ===============================================
              LOADING
          =============================================== */}

          {loading && (

            <div className="website-feedback-state">

              <div className="website-feedback-state-icon">
                ◌
              </div>

              <strong>
                Loading feedback
              </strong>

              <p>
                Please wait while the
                feedback records are loaded.
              </p>

            </div>

          )}


          {/* ===============================================
              TRUE API ERROR
          =============================================== */}

          {!loading &&
            loadError && (

            <div className="website-feedback-state error-state">

              <div className="website-feedback-state-icon">
                !
              </div>

              <strong>
                Feedback data is unavailable
              </strong>

              <p>
                {loadError}
              </p>

            </div>

          )}


          {/* ===============================================
              CORRECT EMPTY STATE
          =============================================== */}

          {!loading &&
            !loadError &&
            records.length === 0 && (

            <div className="website-feedback-state empty-state">

              <div className="website-feedback-state-icon">
                ✎
              </div>


              <strong>

                {role === "Admin"
                  ? "No student feedback yet"
                  : "You haven't submitted any feedback yet"}

              </strong>


              <p>

                {role === "Admin"
                  ? "Student feedback will appear here after a student submits it."
                  : "Use the form above whenever you want to share a suggestion or report an issue."}

              </p>

            </div>

          )}


          {/* ===============================================
              RECORDS TABLE
          =============================================== */}

          {!loading &&
            !loadError &&
            records.length > 0 && (

            <div className="website-feedback-table-wrap">

              <table className="website-feedback-table">

                <thead>

                  <tr>

                    {role === "Admin" && (
                      <th>
                        Student
                      </th>
                    )}

                    <th>
                      Category
                    </th>

                    <th>
                      Rating
                    </th>

                    <th>
                      Message
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {records.map(
                    (
                      record
                    ) => (

                    <tr
                      key={
                        record.id
                      }
                    >

                      {role === "Admin" && (

                        <td>

                          <div className="website-feedback-student">

                            <strong>
                              {
                                record
                                  .student_name
                                ||
                                "Student"
                              }
                            </strong>


                            {record
                              .student_code && (

                              <span>
                                {
                                  record
                                    .student_code
                                }
                              </span>

                            )}

                          </div>

                        </td>

                      )}


                      <td>

                        <span className="website-feedback-category">
                          {
                            record
                              .category
                          }
                        </span>

                      </td>


                      <td>

                        <span className="website-feedback-rating">

                          {
                            record
                              .rating
                          }

                          /5

                        </span>

                      </td>


                      <td className="website-feedback-message-cell">

                        {
                          record
                            .message
                        }

                      </td>


                      <td>

                        {role === "Admin" ? (

                          <select
                            className="website-feedback-status-select"
                            value={
                              record
                                .status
                            }
                            onChange={
                              (
                                event
                              ) =>
                                changeStatus(
                                  record,
                                  event
                                    .target
                                    .value
                                )
                            }
                          >

                            <option value="New">
                              New
                            </option>

                            <option value="Reviewed">
                              Reviewed
                            </option>

                            <option value="Planned">
                              Planned
                            </option>

                            <option value="Resolved">
                              Resolved
                            </option>

                          </select>

                        ) : (

                          <span
                            className={
                              `website-feedback-status status-${String(
                                record.status
                              )
                                .toLowerCase()}`
                            }
                          >

                            {
                              record
                                .status
                            }

                          </span>

                        )}

                      </td>

                    </tr>

                    )
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


export default WebsiteFeedback;