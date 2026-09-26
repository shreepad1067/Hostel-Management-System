import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./AIHub.css";

import api from "../services/api";


function getRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    const payload =
      JSON.parse(
        atob(
          token.split(".")[1]
        )
      );

    return payload.role || null;

  } catch {
    return null;
  }
}


function getErrorMessage(
  error,
  fallback
) {
  if (!error.response) {
    return (
      "Unable to connect to the backend."
    );
  }

  const detail =
    error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(
        (item) =>
          item.msg ||
          "Validation error"
      )
      .join(", ");
  }

  return fallback;
}


function AIHub() {
  const role = getRole();

  const isStudent =
    role === "Student";

  const isAdmin =
    role === "Admin";


  const [
    assistantQuestion,
    setAssistantQuestion,
  ] = useState("");

  const [
    assistantAnswer,
    setAssistantAnswer,
  ] = useState("");

  const [
    assistantLoading,
    setAssistantLoading,
  ] = useState(false);


  const [
    analyticsQuestion,
    setAnalyticsQuestion,
  ] = useState("");

  const [
    analyticsAnswer,
    setAnalyticsAnswer,
  ] = useState("");

  const [
    analyticsLoading,
    setAnalyticsLoading,
  ] = useState(false);


  const [
    complaints,
    setComplaints,
  ] = useState([]);

  const [
    selectedComplaint,
    setSelectedComplaint,
  ] = useState("");

  const [
    complaintResult,
    setComplaintResult,
  ] = useState(null);

  const [
    complaintLoading,
    setComplaintLoading,
  ] = useState(false);


  const [
    noticeForm,
    setNoticeForm,
  ] = useState({
    topic: "",
    category: "General",
    audience: "All Students",
    tone: "Formal",
    key_points: "",
  });

  const [
    noticeResult,
    setNoticeResult,
  ] = useState(null);

  const [
    noticeLoading,
    setNoticeLoading,
  ] = useState(false);


  const [
    provisioning,
    setProvisioning,
  ] = useState(null);


  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const loadManagementData =
    useCallback(async () => {

      if (isStudent) {
        return;
      }

      try {
        setError("");

        const complaintsResponse =
          await api.get(
            "/ai/complaints/queue"
          );

        setComplaints(
          complaintsResponse.data || []
        );


        if (
          complaintsResponse.data
            ?.length > 0
        ) {
          setSelectedComplaint(
            String(
              complaintsResponse
                .data[0]
                .id
            )
          );
        }


        if (isAdmin) {
          const provisioningResponse =
            await api.get(
              "/ai/provisioning-summary"
            );

          setProvisioning(
            provisioningResponse.data
          );
        }

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load AI management data."
          )
        );
      }

    }, [
      isStudent,
      isAdmin,
    ]);


  useEffect(() => {
    loadManagementData();
  }, [loadManagementData]);


  const askAssistant =
    async (event) => {
      event.preventDefault();

      if (
        !assistantQuestion.trim()
      ) {
        setError(
          "Enter a question first."
        );

        return;
      }

      try {
        setAssistantLoading(true);
        setError("");
        setSuccess("");
        setAssistantAnswer("");

        const response =
          await api.post(
            "/ai/assistant",
            {
              question:
                assistantQuestion.trim(),
            }
          );

        setAssistantAnswer(
          response.data.answer
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "AI Assistant is unavailable."
          )
        );

      } finally {
        setAssistantLoading(false);
      }
    };


  const askAnalytics =
    async (event) => {
      event.preventDefault();

      if (
        !analyticsQuestion.trim()
      ) {
        setError(
          "Enter an analytics question."
        );

        return;
      }

      try {
        setAnalyticsLoading(true);
        setError("");
        setSuccess("");
        setAnalyticsAnswer("");

        const response =
          await api.post(
            "/ai/analytics",
            {
              question:
                analyticsQuestion.trim(),
            }
          );

        setAnalyticsAnswer(
          response.data.answer
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "AI analytics is unavailable."
          )
        );

      } finally {
        setAnalyticsLoading(false);
      }
    };


  const analyzeComplaint =
    async () => {

      if (!selectedComplaint) {
        setError(
          "Select a complaint first."
        );

        return;
      }

      try {
        setComplaintLoading(true);
        setError("");
        setSuccess("");
        setComplaintResult(null);

        const response =
          await api.post(
            `/ai/complaints/${selectedComplaint}/analyze`
          );

        setComplaintResult(
          response.data
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to analyze complaint."
          )
        );

      } finally {
        setComplaintLoading(false);
      }
    };


  const handleNoticeChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;

      setNoticeForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const generateNotice =
    async (event) => {
      event.preventDefault();

      if (!noticeForm.topic.trim()) {
        setError(
          "Enter the notice topic."
        );

        return;
      }

      try {
        setNoticeLoading(true);
        setError("");
        setSuccess("");
        setNoticeResult(null);

        const response =
          await api.post(
            "/ai/notice-draft",
            {
              topic:
                noticeForm
                  .topic
                  .trim(),

              category:
                noticeForm.category,

              audience:
                noticeForm.audience,

              tone:
                noticeForm.tone,

              key_points:
                noticeForm
                  .key_points
                  .trim()
                || null,
            }
          );

        setNoticeResult(
          response.data
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to generate notice."
          )
        );

      } finally {
        setNoticeLoading(false);
      }
    };


  const copyNotice =
    async () => {

      if (!noticeResult) {
        return;
      }

      const text = [
        noticeResult.title,
        "",
        noticeResult.content,
        "",
        noticeResult.remarks
          ? `Remarks: ${noticeResult.remarks}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await navigator
          .clipboard
          .writeText(text);

        setSuccess(
          "AI notice draft copied."
        );

      } catch {
        setError(
          "Unable to copy the notice draft."
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
              HOSTELHUB INTELLIGENCE
            </span>

            <h1>
              AI Center
            </h1>

            <p>
              {isStudent
                ? (
                  "Ask questions using your "
                  + "HostelHub information."
                )
                : (
                  "AI-assisted hostel operations, "
                  + "complaints and analytics."
                )}
            </p>

          </div>


          <div className="ai-role-card">

            <span>
              ACCESS LEVEL
            </span>

            <strong>
              {role}
            </strong>

          </div>

        </header>


        {error && (
          <div className="ai-message error">
            {error}
          </div>
        )}


        {success && (
          <div className="ai-message success">
            {success}
          </div>
        )}


        <section className="overview-card ai-section">

          <div className="ai-section-header">

            <div className="ai-section-icon">
              ✦
            </div>

            <div>

              <h2>
                Hostel AI Assistant
              </h2>

              <p>
                Ask about information available
                in your HostelHub account.
              </p>

            </div>

          </div>


          <form
            className="ai-question-form"
            onSubmit={askAssistant}
          >

            <textarea
              rows={3}
              maxLength={1000}
              placeholder={
                isStudent
                  ? (
                    "Example: What meals have "
                    + "I confirmed today?"
                  )
                  : (
                    "Example: How many complaints "
                    + "are still pending?"
                  )
              }
              value={
                assistantQuestion
              }
              onChange={(event) =>
                setAssistantQuestion(
                  event.target.value
                )
              }
            />

            <button
              type="submit"
              className="ai-primary-button"
              disabled={
                assistantLoading
              }
            >
              {assistantLoading
                ? "Thinking..."
                : "Ask Hostel AI"}
            </button>

          </form>


          {assistantAnswer && (
            <div className="ai-answer">

              <div className="ai-answer-title">
                AI Response
              </div>

              <p>
                {assistantAnswer}
              </p>

            </div>
          )}

        </section>


        {!isStudent && (
          <section className="overview-card ai-section">

            <div className="ai-section-header">

              <div className="ai-section-icon">
                ⚠
              </div>

              <div>

                <h2>
                  Complaint Intelligence
                </h2>

                <p>
                  Generate a category,
                  priority, summary and
                  recommended staff action.
                </p>

              </div>

            </div>


            {complaints.length === 0 ? (
              <div className="ai-empty">
                No complaints are available.
              </div>

            ) : (
              <>

                <div className="ai-complaint-controls">

                  <select
                    value={
                      selectedComplaint
                    }
                    onChange={(event) => {
                      setSelectedComplaint(
                        event.target.value
                      );

                      setComplaintResult(
                        null
                      );
                    }}
                  >

                    {complaints.map(
                      (complaint) => (

                        <option
                          key={complaint.id}
                          value={complaint.id}
                        >
                          #{complaint.id}
                          {" — "}
                          {complaint.title}
                          {" — "}
                          {complaint.status}
                        </option>

                      )
                    )}

                  </select>


                  <button
                    type="button"
                    className="ai-primary-button"
                    onClick={
                      analyzeComplaint
                    }
                    disabled={
                      complaintLoading
                    }
                  >
                    {complaintLoading
                      ? "Analyzing..."
                      : "Analyze Complaint"}
                  </button>

                </div>


                {selectedComplaint && (
                  <div className="ai-selected-complaint">

                    {(() => {
                      const complaint =
                        complaints.find(
                          (item) =>
                            String(item.id)
                            ===
                            String(
                              selectedComplaint
                            )
                        );

                      if (!complaint) {
                        return null;
                      }

                      return (
                        <>
                          <strong>
                            {
                              complaint
                                .title
                            }
                          </strong>

                          <p>
                            {
                              complaint
                                .description
                            }
                          </p>

                          <small>
                            Current category:{" "}
                            {
                              complaint
                                .category
                            }
                            {" • "}
                            Status:{" "}
                            {
                              complaint
                                .status
                            }
                          </small>
                        </>
                      );
                    })()}

                  </div>
                )}


                {complaintResult && (
                  <div className="ai-analysis-grid">

                    <div className="ai-analysis-card">

                      <span>
                        Suggested Category
                      </span>

                      <strong>
                        {
                          complaintResult
                            .suggested_category
                        }
                      </strong>

                    </div>


                    <div className="ai-analysis-card">

                      <span>
                        AI Priority
                      </span>

                      <strong
                        className={
                          `ai-priority ${
                            complaintResult
                              .priority
                              .toLowerCase()
                          }`
                        }
                      >
                        {
                          complaintResult
                            .priority
                        }
                      </strong>

                    </div>


                    <div className="ai-analysis-card wide">

                      <span>
                        Summary
                      </span>

                      <p>
                        {
                          complaintResult
                            .summary
                        }
                      </p>

                    </div>


                    <div className="ai-analysis-card wide">

                      <span>
                        Recommended Action
                      </span>

                      <p>
                        {
                          complaintResult
                            .recommended_action
                        }
                      </p>

                    </div>

                  </div>
                )}

              </>
            )}

          </section>
        )}


        {!isStudent && (
          <section className="overview-card ai-section">

            <div className="ai-section-header">

              <div className="ai-section-icon">
                ◉
              </div>

              <div>

                <h2>
                  AI Notice Generator
                </h2>

                <p>
                  Generate a notice draft
                  for review before publishing.
                </p>

              </div>

            </div>


            <form
              className="ai-notice-form"
              onSubmit={
                generateNotice
              }
            >

              <div className="ai-field">

                <label htmlFor="topic">
                  Notice Topic
                </label>

                <input
                  id="topic"
                  name="topic"
                  type="text"
                  maxLength={500}
                  placeholder={
                    "Example: Water supply maintenance"
                  }
                  value={
                    noticeForm.topic
                  }
                  onChange={
                    handleNoticeChange
                  }
                  required
                />

              </div>


              <div className="ai-field">

                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={
                    noticeForm.category
                  }
                  onChange={
                    handleNoticeChange
                  }
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


              <div className="ai-field">

                <label htmlFor="audience">
                  Audience
                </label>

                <select
                  id="audience"
                  name="audience"
                  value={
                    noticeForm.audience
                  }
                  onChange={
                    handleNoticeChange
                  }
                >

                  <option value="All Students">
                    All Students
                  </option>

                  <option value="Hostel Residents">
                    Hostel Residents
                  </option>

                  <option value="Wardens">
                    Wardens
                  </option>

                  <option value="Students and Staff">
                    Students and Staff
                  </option>

                </select>

              </div>


              <div className="ai-field">

                <label htmlFor="tone">
                  Tone
                </label>

                <select
                  id="tone"
                  name="tone"
                  value={
                    noticeForm.tone
                  }
                  onChange={
                    handleNoticeChange
                  }
                >

                  <option value="Formal">
                    Formal
                  </option>

                  <option value="Friendly">
                    Friendly
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>

                  <option value="Informative">
                    Informative
                  </option>

                </select>

              </div>


              <div className="ai-field full">

                <label htmlFor="key_points">
                  Important Points
                </label>

                <textarea
                  id="key_points"
                  name="key_points"
                  rows={4}
                  maxLength={1500}
                  placeholder={
                    "Enter dates, timings, instructions or other facts the AI must include."
                  }
                  value={
                    noticeForm.key_points
                  }
                  onChange={
                    handleNoticeChange
                  }
                />

              </div>


              <div className="ai-form-action">

                <button
                  type="submit"
                  className="ai-primary-button"
                  disabled={
                    noticeLoading
                  }
                >
                  {noticeLoading
                    ? "Generating..."
                    : "Generate Notice"}
                </button>

              </div>

            </form>


            {noticeResult && (
              <div className="ai-notice-result">

                <div className="ai-notice-result-header">

                  <div>

                    <span>
                      AI GENERATED DRAFT
                    </span>

                    <h3>
                      {noticeResult.title}
                    </h3>

                  </div>


                  <button
                    type="button"
                    className="ai-secondary-button"
                    onClick={copyNotice}
                  >
                    Copy Draft
                  </button>

                </div>


                <div className="ai-notice-category">
                  {noticeResult.category}
                </div>


                <p>
                  {noticeResult.content}
                </p>


                {noticeResult.remarks && (
                  <small>
                    Remarks:{" "}
                    {
                      noticeResult
                        .remarks
                    }
                  </small>
                )}

              </div>
            )}

          </section>
        )}


        {!isStudent && (
          <section className="overview-card ai-section">

            <div className="ai-section-header">

              <div className="ai-section-icon">
                ▥
              </div>

              <div>

                <h2>
                  Natural Language Analytics
                </h2>

                <p>
                  Ask questions about the
                  hostel management statistics.
                </p>

              </div>

            </div>


            <form
              className="ai-question-form"
              onSubmit={askAnalytics}
            >

              <textarea
                rows={3}
                maxLength={1000}
                placeholder={
                  "Example: Give me a summary of pending complaints, SOS alerts and student accounts."
                }
                value={
                  analyticsQuestion
                }
                onChange={(event) =>
                  setAnalyticsQuestion(
                    event.target.value
                  )
                }
              />

              <button
                type="submit"
                className="ai-primary-button"
                disabled={
                  analyticsLoading
                }
              >
                {analyticsLoading
                  ? "Analyzing..."
                  : "Analyze Hostel Data"}
              </button>

            </form>


            {analyticsAnswer && (
              <div className="ai-answer">

                <div className="ai-answer-title">
                  Analytics Response
                </div>

                <p>
                  {analyticsAnswer}
                </p>

              </div>
            )}

          </section>
        )}


        {isAdmin && provisioning && (
          <section className="overview-card ai-section">

            <div className="ai-section-header">

              <div className="ai-section-icon">
                ♙
              </div>

              <div>

                <h2>
                  Account Provisioning
                </h2>

                <p>
                  Identify admitted students
                  who still need their
                  HostelHub account.
                </p>

              </div>

            </div>


            <div className="ai-provision-summary">

              <div>

                <span>
                  Admitted
                </span>

                <strong>
                  {
                    provisioning
                      .admitted_students
                  }
                </strong>

              </div>


              <div>

                <span>
                  Accounts Linked
                </span>

                <strong>
                  {
                    provisioning
                      .linked_accounts
                  }
                </strong>

              </div>


              <div>

                <span>
                  Accounts Pending
                </span>

                <strong>
                  {
                    provisioning
                      .accounts_pending
                  }
                </strong>

              </div>

            </div>


            {provisioning
              .students_without_accounts
              .length > 0 && (

              <div className="ai-provision-table-wrapper">

                <table className="ai-provision-table">

                  <thead>

                    <tr>
                      <th>
                        Student ID
                      </th>

                      <th>
                        Name
                      </th>

                      <th>
                        Course
                      </th>

                      <th>
                        Year
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {
                      provisioning
                        .students_without_accounts
                        .map(
                          (student) => (

                            <tr
                              key={
                                student
                                  .student_id
                              }
                            >

                              <td>
                                {
                                  student
                                    .student_code
                                  ||
                                  `#${student.student_id}`
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .name
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .course
                                  || "-"
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .year
                                  || "-"
                                }
                              </td>

                            </tr>

                          )
                        )
                    }

                  </tbody>

                </table>

              </div>
            )}


            <div className="ai-security-note">

              AI only identifies students
              needing accounts. Password
              creation and authentication
              remain inside the secure
              HostelHub backend.

            </div>

          </section>
        )}


        <section className="ai-disclaimer">

          <strong>
            AI Assistance
          </strong>

          <p>
            AI results are suggestions.
            Hostel staff remain responsible
            for complaint actions, notices
            and emergency decisions.
          </p>

        </section>

      </main>

    </div>
  );
}


export default AIHub;