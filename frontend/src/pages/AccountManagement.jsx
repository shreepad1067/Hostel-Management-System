import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./AccountManagement.css";

import api from "../services/api";


const EMPTY_WARDEN_FORM = {
  full_name: "",
  email: "",
  phone_number: "",
  username: "",
};


const EMPTY_STUDENT_FORM = {
  student_code: "",
  username: "",
};


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


function AccountManagement() {
  const [
    overview,
    setOverview,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingStudent,
    setSavingStudent,
  ] = useState(false);

  const [
    savingWarden,
    setSavingWarden,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    studentForm,
    setStudentForm,
  ] = useState(
    EMPTY_STUDENT_FORM
  );

  const [
    wardenForm,
    setWardenForm,
  ] = useState(
    EMPTY_WARDEN_FORM
  );


  const loadOverview =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/accounts/overview"
          );

        setOverview(
          response.data
        );

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load account information."
          )
        );

      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadOverview();
  }, [loadOverview]);


  const handleStudentChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setStudentForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const handleWardenChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setWardenForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const provisionStudent =
    async (event) => {
      event.preventDefault();

      if (
        !studentForm
          .student_code
          .trim()
      ) {
        setError(
          "Enter the HostelHub Student ID."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Create this Student account and email temporary credentials?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingStudent(true);
        setError("");
        setSuccess("");

        const response =
          await api.post(
            "/accounts/student",
            {
              student_code:
                studentForm
                  .student_code
                  .trim()
                  .toUpperCase(),

              username:
                studentForm
                  .username
                  .trim()
                || null,
            }
          );

        setSuccess(
          response.data.message
        );

        setStudentForm({
          ...EMPTY_STUDENT_FORM,
        });

        await loadOverview();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to create Student account."
          )
        );

      } finally {
        setSavingStudent(false);
      }
    };


  const provisionWarden =
    async (event) => {
      event.preventDefault();

      if (
        !wardenForm
          .full_name
          .trim()
      ) {
        setError(
          "Enter the Warden's full name."
        );

        return;
      }

      if (
        !wardenForm
          .email
          .trim()
      ) {
        setError(
          "Enter the Warden's email."
        );

        return;
      }

      if (
        !wardenForm
          .phone_number
          .trim()
      ) {
        setError(
          "Enter the Warden's phone number."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Create this Warden account and email temporary credentials?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingWarden(true);
        setError("");
        setSuccess("");

        const response =
          await api.post(
            "/accounts/warden",
            {
              full_name:
                wardenForm
                  .full_name
                  .trim(),

              email:
                wardenForm
                  .email
                  .trim(),

              phone_number:
                wardenForm
                  .phone_number
                  .trim(),

              username:
                wardenForm
                  .username
                  .trim()
                || null,
            }
          );

        setSuccess(
          response.data.message
        );

        setWardenForm({
          ...EMPTY_WARDEN_FORM,
        });

        await loadOverview();

      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to create Warden account."
          )
        );

      } finally {
        setSavingWarden(false);
      }
    };


  const chooseStudent =
    (student) => {
      if (student.has_account) {
        return;
      }

      setStudentForm({
        student_code:
          student.student_code
          || "",

        username: "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">
              ADMINISTRATION
            </span>

            <h1>
              Account Management
            </h1>

            <p>
              Provision controlled Student
              and Warden HostelHub accounts.
            </p>

          </div>


          <div className="account-security-badge">

            <span>
              ADMIN ACCOUNTS
            </span>

            <strong>
              1 Only
            </strong>

          </div>

        </header>


        {error && (
          <div className="account-message error">
            {error}
          </div>
        )}


        {success && (
          <div className="account-message success">
            {success}
          </div>
        )}


        {loading ? (
          <section className="overview-card">

            <div className="account-empty">
              Loading account information...
            </div>

          </section>

        ) : overview && (
          <>

            <section className="account-summary-grid">

              <div className="account-summary-card">

                <span>
                  Admitted Students
                </span>

                <strong>
                  {
                    overview
                      .admitted_students
                  }
                </strong>

              </div>


              <div className="account-summary-card">

                <span>
                  Student Accounts
                </span>

                <strong>
                  {
                    overview
                      .linked_student_accounts
                  }
                </strong>

              </div>


              <div className="account-summary-card pending">

                <span>
                  Accounts Pending
                </span>

                <strong>
                  {
                    overview
                      .pending_student_accounts
                  }
                </strong>

              </div>


              <div className="account-summary-card">

                <span>
                  Wardens
                </span>

                <strong>
                  {
                    overview
                      .total_wardens
                  }
                </strong>

              </div>

            </section>


            <section className="account-form-grid">

              <div className="overview-card">

                <div className="account-section-heading">

                  <div>

                    <h2>
                      Create Student Account
                    </h2>

                    <p>
                      Use an admitted student's
                      HostelHub Student ID.
                    </p>

                  </div>

                </div>


                <form
                  className="account-form"
                  onSubmit={
                    provisionStudent
                  }
                >

                  <div className="account-field">

                    <label htmlFor="student_code">
                      HostelHub Student ID
                    </label>

                    <input
                      id="student_code"
                      name="student_code"
                      type="text"
                      placeholder="HMS202600001"
                      value={
                        studentForm
                          .student_code
                      }
                      onChange={
                        handleStudentChange
                      }
                      disabled={
                        savingStudent
                      }
                      required
                    />

                  </div>


                  <div className="account-field">

                    <label htmlFor="student_username">
                      Username
                      <small>
                        {" "}
                        — optional
                      </small>
                    </label>

                    <input
                      id="student_username"
                      name="username"
                      type="text"
                      placeholder={
                        "Leave blank to generate automatically"
                      }
                      value={
                        studentForm.username
                      }
                      onChange={
                        handleStudentChange
                      }
                      disabled={
                        savingStudent
                      }
                    />

                  </div>


                  <div className="account-info-box">

                    <strong>
                      Secure provisioning
                    </strong>

                    <p>
                      HostelHub generates the
                      temporary password on the
                      server and sends it directly
                      to the student's registered
                      email. The Admin cannot view
                      the password.
                    </p>

                  </div>


                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      savingStudent
                    }
                  >
                    {savingStudent
                      ? "Creating Account..."
                      : "Create Student Account"}
                  </button>

                </form>

              </div>


              <div className="overview-card">

                <div className="account-section-heading">

                  <div>

                    <h2>
                      Create Warden Account
                    </h2>

                    <p>
                      Add an authorized hostel
                      Warden account.
                    </p>

                  </div>

                </div>


                <form
                  className="account-form"
                  onSubmit={
                    provisionWarden
                  }
                >

                  <div className="account-field">

                    <label htmlFor="warden_full_name">
                      Full Name
                    </label>

                    <input
                      id="warden_full_name"
                      name="full_name"
                      type="text"
                      placeholder="Warden full name"
                      value={
                        wardenForm.full_name
                      }
                      onChange={
                        handleWardenChange
                      }
                      disabled={
                        savingWarden
                      }
                      required
                    />

                  </div>


                  <div className="account-field">

                    <label htmlFor="warden_email">
                      Email
                    </label>

                    <input
                      id="warden_email"
                      name="email"
                      type="email"
                      placeholder="warden@example.com"
                      value={
                        wardenForm.email
                      }
                      onChange={
                        handleWardenChange
                      }
                      disabled={
                        savingWarden
                      }
                      required
                    />

                  </div>


                  <div className="account-field">

                    <label htmlFor="warden_phone">
                      Phone Number
                    </label>

                    <input
                      id="warden_phone"
                      name="phone_number"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={
                        wardenForm
                          .phone_number
                      }
                      onChange={
                        handleWardenChange
                      }
                      disabled={
                        savingWarden
                      }
                      required
                    />

                  </div>


                  <div className="account-field">

                    <label htmlFor="warden_username">
                      Username
                      <small>
                        {" "}
                        — optional
                      </small>
                    </label>

                    <input
                      id="warden_username"
                      name="username"
                      type="text"
                      placeholder={
                        "Leave blank to generate automatically"
                      }
                      value={
                        wardenForm.username
                      }
                      onChange={
                        handleWardenChange
                      }
                      disabled={
                        savingWarden
                      }
                    />

                  </div>


                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      savingWarden
                    }
                  >
                    {savingWarden
                      ? "Creating Account..."
                      : "Create Warden Account"}
                  </button>

                </form>

              </div>

            </section>


            <section className="overview-card account-table-section">

              <div className="account-section-heading">

                <div>

                  <h2>
                    Student Account Status
                  </h2>

                  <p>
                    Admitted students and their
                    HostelHub account status.
                  </p>

                </div>

              </div>


              {overview.students.length === 0 ? (

                <div className="account-empty">
                  No admitted students found.
                </div>

              ) : (

                <div className="account-table-wrapper">

                  <table className="account-table">

                    <thead>

                      <tr>

                        <th>
                          Student ID
                        </th>

                        <th>
                          Student
                        </th>

                        <th>
                          Course
                        </th>

                        <th>
                          Contact
                        </th>

                        <th>
                          Account
                        </th>

                        <th>
                          Username
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {overview.students.map(
                        (student) => (

                          <tr
                            key={
                              student.student_id
                            }
                          >

                            <td>
                              {
                                student.student_code
                                ||
                                `#${student.student_id}`
                              }
                            </td>


                            <td>

                              <strong>
                                {student.name}
                              </strong>

                            </td>


                            <td>

                              {
                                student.course
                                || "-"
                              }

                              {student.year
                                ? ` · Year ${student.year}`
                                : ""}

                            </td>


                            <td>

                              <div>
                                {student.email}
                              </div>

                              <small>
                                {student.phone}
                              </small>

                            </td>


                            <td>

                              <span
                                className={
                                  student.has_account
                                    ? "account-status active"
                                    : "account-status pending"
                                }
                              >
                                {student.has_account
                                  ? "Account Created"
                                  : "Pending"}
                              </span>

                            </td>


                            <td>

                              {
                                student.username
                                || "-"
                              }

                            </td>


                            <td>

                              {student.has_account ? (

                                <span className="account-complete">
                                  ✓ Complete
                                </span>

                              ) : (

                                <button
                                  type="button"
                                  className="account-create-button"
                                  onClick={() =>
                                    chooseStudent(
                                      student
                                    )
                                  }
                                >
                                  Provision
                                </button>

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


            <section className="overview-card account-table-section">

              <div className="account-section-heading">

                <div>

                  <h2>
                    Warden Accounts
                  </h2>

                  <p>
                    Authorized Warden accounts
                    in HostelHub.
                  </p>

                </div>

              </div>


              {overview.wardens.length === 0 ? (

                <div className="account-empty">
                  No Warden accounts found.
                </div>

              ) : (

                <div className="account-table-wrapper">

                  <table className="account-table">

                    <thead>

                      <tr>

                        <th>
                          ID
                        </th>

                        <th>
                          Warden
                        </th>

                        <th>
                          Username
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Phone
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {overview.wardens.map(
                        (warden) => (

                          <tr key={warden.id}>

                            <td>
                              #{warden.id}
                            </td>

                            <td>
                              {
                                warden.full_name
                                || "-"
                              }
                            </td>

                            <td>
                              {
                                warden.username
                              }
                            </td>

                            <td>
                              {
                                warden.email
                              }
                            </td>

                            <td>
                              {
                                warden.phone_number
                                || "-"
                              }
                            </td>

                            <td>

                              <span
                                className={
                                  warden.is_active
                                    ? "account-status active"
                                    : "account-status inactive"
                                }
                              >
                                {warden.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>


            <section className="account-security-panel">

              <strong>
                Account Security
              </strong>

              <p>
                Public registration is disabled.
                Only the Admin can provision
                Student and Warden accounts.
                Temporary passwords are sent
                directly by email and are never
                displayed inside the Admin panel.
              </p>

            </section>

          </>
        )}

      </main>

    </div>
  );
}


export default AccountManagement;