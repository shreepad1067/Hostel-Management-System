import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";

import Pagination from "../components/Pagination";

import "../components/Sidebar.css";
import "./Students.css";

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


function getApiErrorMessage(
  error,
  fallback
) {
  if (
    !error.response
  ) {
    return (
      "Unable to connect to the backend."
    );
  }


  const detail =
    error
      .response
      .data
      ?.detail;


  if (
    Array.isArray(
      detail
    )
  ) {
    return detail
      .map(
        (
          item
        ) => {

          const location =
            Array.isArray(
              item.loc
            )
              ? item.loc[
                  item.loc.length -
                  1
                ]
              : "field";


          return (
            `${location}: ${
              item.msg ||
              "Invalid input"
            }`
          );
        }
      )
      .join(", ");
  }


  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }


  return fallback;
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


  return date
    .toLocaleDateString(
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


function uniqueValues(
  values
) {
  return [
    ...new Set(
      values
        .map(
          (
            value
          ) =>
            String(
              value || ""
            ).trim()
        )
        .filter(
          Boolean
        )
    ),
  ].sort(
    (
      first,
      second
    ) =>
      first.localeCompare(
        second,
        undefined,
        {
          numeric:
            true,
        }
      )
  );
}


function Students() {
  const role =
    decodeRole();

  const isAdmin =
    role === "Admin";


  const emptyForm = {
    name:
      "",

    email:
      "",

    phone:
      "",

    course:
      "",

    department:
      "",

    year:
      "",

    semester:
      "",

    profile_photo_url:
      "",

    room_number:
      "",

    guardian_phone:
      "",

    parent_name:
      "",

    parent_email:
      "",

    emergency_contact:
      "",

    address:
      "",

    room_preference:
      "",

    admission_status:
      "Pending",

    admission_date:
      "",
  };


  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    allocations,
    setAllocations,
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
  // FORM
  // ==========================================

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingStudent,
    setEditingStudent,
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
  // FEATURE 9 — SEARCH / FILTER / SORT
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    admissionFilter,
    setAdmissionFilter,
  ] = useState("All");

  const [
    courseFilter,
    setCourseFilter,
  ] = useState("All");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("All");

  const [
    yearFilter,
    setYearFilter,
  ] = useState("All");

  const [
    roomFilter,
    setRoomFilter,
  ] = useState("All");

  const [
    accountFilter,
    setAccountFilter,
  ] = useState("All");

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "newest"
  );


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
  // LOAD STUDENTS
  // ==========================================

  const fetchStudents =
    async () => {

      try {

        setLoading(
          true
        );

        setError("");


        const [studentResponse, allocationResponse] =
          await Promise.all([
            api.get("/students/"),
            api.get("/allocations/"),
          ]);

        setStudents(
          Array.isArray(studentResponse.data)
            ? studentResponse.data
            : []
        );

        setAllocations(
          Array.isArray(allocationResponse.data)
            ? allocationResponse.data
            : []
        );

      } catch (
        requestError
      ) {

        console.error(
          "Failed to load students:",
          requestError
        );


        setStudents(
          []
        );

        setAllocations([]);

        setError(
          getApiErrorMessage(
            requestError,
            "Failed to load students."
          )
        );

      } finally {

        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    fetchStudents();
  }, []);


  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const courses =
    useMemo(
      () =>
        uniqueValues(
          students.map(
            (
              student
            ) =>
              student.course
          )
        ),
      [students]
    );


  const departments =
    useMemo(
      () =>
        uniqueValues(
          students.map(
            (
              student
            ) =>
              student.department
          )
        ),
      [students]
    );


  const years =
    useMemo(
      () =>
        [
          ...new Set(
            students
              .map(
                (
                  student
                ) =>
                  student.year
              )
              .filter(
                (
                  value
                ) =>
                  value !==
                    null &&
                  value !==
                    undefined &&
                  value !==
                    ""
              )
          ),
        ]
          .sort(
            (
              first,
              second
            ) =>
              Number(first) -
              Number(second)
          ),
      [students]
    );


  const admissionStatuses =
    useMemo(
      () =>
        uniqueValues(
          students.map(
            (
              student
            ) =>
              student.admission_status
          )
        ),
      [students]
    );


  // ==========================================
  // ACTIVE ROOM ALLOCATIONS
  // ==========================================

  const activeStudentIds = useMemo(
    () => new Set(
      allocations
        .filter(
          (allocation) =>
            String(allocation.status || "")
              .trim()
              .toLowerCase() === "active"
        )
        .map((allocation) => Number(allocation.student_id))
    ),
    [allocations]
  );

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary =
    useMemo(
      () => {

        let admitted =
          0;

        let pending =
          0;

        let allocated =
          0;

        let linked =
          0;


        students.forEach(
          (
            student
          ) => {

            const status =
              String(
                student
                  .admission_status ||
                ""
              )
                .trim()
                .toLowerCase();


            if (
              status ===
                "admitted" ||
              status ===
                "approved"
            ) {
              admitted +=
                1;
            }


            if (
              status ===
              "pending"
            ) {
              pending +=
                1;
            }


            if (activeStudentIds.has(Number(student.id))) {
              allocated += 1;
            }


            if (
              student.user_id
            ) {
              linked +=
                1;
            }
          }
        );


        return {
          total:
            students.length,

          admitted,

          pending,

          allocated,

          linked,
        };
      },
      [students, activeStudentIds]
    );


  // ==========================================
  // FILTERED + SORTED
  // ==========================================

  const filteredStudents =
    useMemo(
      () => {

        const term =
          search
            .trim()
            .toLowerCase();


        const filtered =
          students.filter(
            (
              student
            ) => {

              const searchable =
                [
                  student.student_code,
                  student.name,
                  student.email,
                  student.phone,
                  student.course,
                  student.department,
                  student.year,
                  student.semester,
                  activeStudentIds.has(Number(student.id))
                    ? student.room_number
                    : null,
                  student.parent_name,
                  student.parent_email,
                  student.guardian_phone,
                  student.emergency_contact,
                  student.address,
                  student.room_preference,
                  student.admission_status,
                ]
                  .filter(
                    (
                      value
                    ) =>
                      value !==
                        null &&
                      value !==
                        undefined
                  )
                  .join(" ")
                  .toLowerCase();


              const matchesSearch =
                !term ||
                searchable.includes(
                  term
                );


              const matchesAdmission =
                admissionFilter ===
                  "All" ||
                student
                  .admission_status ===
                  admissionFilter;


              const matchesCourse =
                courseFilter ===
                  "All" ||
                student.course ===
                  courseFilter;


              const matchesDepartment =
                departmentFilter ===
                  "All" ||
                (
                  student.department ||
                  ""
                ) ===
                  departmentFilter;


              const matchesYear =
                yearFilter ===
                  "All" ||
                String(
                  student.year
                ) ===
                  String(
                    yearFilter
                  );


              const hasActiveRoom =
                activeStudentIds.has(Number(student.id));

              const matchesRoom =
                roomFilter === "All" ||
                (roomFilter === "Allocated"
                  ? hasActiveRoom
                  : !hasActiveRoom);


              const matchesAccount =
                accountFilter ===
                  "All" ||
                (
                  accountFilter ===
                    "Linked"
                    ? Boolean(
                        student
                          .user_id
                      )
                    : !student
                        .user_id
                );


              return (
                matchesSearch &&
                matchesAdmission &&
                matchesCourse &&
                matchesDepartment &&
                matchesYear &&
                matchesRoom &&
                matchesAccount
              );
            }
          );


        return [
          ...filtered,
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
                  Number(
                    first.id
                  ) -
                  Number(
                    second.id
                  )
                );


              case "name-asc":
                return (
                  String(
                    first.name ||
                    ""
                  )
                    .localeCompare(
                      String(
                        second.name ||
                        ""
                      )
                    )
                );


              case "name-desc":
                return (
                  String(
                    second.name ||
                    ""
                  )
                    .localeCompare(
                      String(
                        first.name ||
                        ""
                      )
                    )
                );


              case "code-asc":
                return (
                  String(
                    first
                      .student_code ||
                    ""
                  )
                    .localeCompare(
                      String(
                        second
                          .student_code ||
                        ""
                      ),
                      undefined,
                      {
                        numeric:
                          true,
                      }
                    )
                );


              case "year-asc":
                return (
                  Number(
                    first.year ||
                    0
                  ) -
                  Number(
                    second.year ||
                    0
                  )
                );


              case "year-desc":
                return (
                  Number(
                    second.year ||
                    0
                  ) -
                  Number(
                    first.year ||
                    0
                  )
                );


              case "newest":
              default:
                return (
                  Number(
                    second.id
                  ) -
                  Number(
                    first.id
                  )
                );
            }
          }
        );
      },
      [
        students,
        activeStudentIds,
        search,
        admissionFilter,
        courseFilter,
        departmentFilter,
        yearFilter,
        roomFilter,
        accountFilter,
        sortBy,
      ]
    );


  // ==========================================
  // PAGINATION CALCULATIONS
  // ==========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredStudents.length /
        pageSize
      )
    );


  const paginatedStudents =
    useMemo(
      () => {

        const start =
          (
            currentPage -
            1
          ) *
          pageSize;


        return filteredStudents.slice(
          start,
          start +
            pageSize
        );
      },
      [
        filteredStudents,
        currentPage,
        pageSize,
      ]
    );


  // ==========================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================

  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    search,
    admissionFilter,
    courseFilter,
    departmentFilter,
    yearFilter,
    roomFilter,
    accountFilter,
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
  // FORM HANDLERS
  // ==========================================

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


  const openAddForm =
    () => {

      setEditingStudent(
        null
      );

      setFormData(
        emptyForm
      );

      setError("");

      setSuccess("");

      setShowForm(
        true
      );
    };


  const openEditForm =
    (
      student
    ) => {

      setEditingStudent(
        student
      );


      setFormData({
        name:
          student.name ||
          "",

        email:
          student.email ||
          "",

        phone:
          student.phone ||
          "",

        course:
          student.course ||
          "",

        department:
          student.department ||
          "",

        year:
          student.year ||
          "",

        semester:
          student.semester ||
          "",

        profile_photo_url:
          student
            .profile_photo_url ||
          "",

        room_number:
          student.room_number ||
          "",

        guardian_phone:
          student
            .guardian_phone ||
          "",

        parent_name:
          student.parent_name ||
          "",

        parent_email:
          student.parent_email ||
          "",

        emergency_contact:
          student
            .emergency_contact ||
          "",

        address:
          student.address ||
          "",

        room_preference:
          student
            .room_preference ||
          "",

        admission_status:
          student
            .admission_status ||
          "Pending",

        admission_date:
          student
            .admission_date ||
          "",
      });


      setError("");

      setSuccess("");

      setShowForm(
        true
      );


      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    };


  const closeForm =
    () => {

      setShowForm(
        false
      );

      setEditingStudent(
        null
      );

      setFormData(
        emptyForm
      );
    };


  // ==========================================
  // SAVE STUDENT
  // ==========================================

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      try {

        setSaving(
          true
        );

        setError("");

        setSuccess("");


        const payload = {
          name:
            formData
              .name
              .trim(),

          email:
            formData
              .email
              .trim(),

          phone:
            formData
              .phone
              .trim(),

          course:
            formData
              .course
              .trim(),

          department:
            formData
              .department
              .trim() ||
            null,

          year:
            Number(
              formData.year
            ),

          semester:
            formData
              .semester
              ? Number(
                  formData
                    .semester
                )
              : null,

          profile_photo_url:
            formData
              .profile_photo_url
              .trim() ||
            null,

          room_number:
            editingStudent
              ? (
                  editingStudent
                    .room_number ||
                  null
                )
              : null,

          guardian_phone:
            formData
              .guardian_phone
              .trim() ||
            null,

          parent_name:
            formData
              .parent_name
              .trim() ||
            null,

          parent_email:
            formData
              .parent_email
              .trim() ||
            null,

          emergency_contact:
            formData
              .emergency_contact
              .trim() ||
            null,

          address:
            formData
              .address
              .trim() ||
            null,

          room_preference:
            formData
              .room_preference ||
            null,

          admission_status:
            formData
              .admission_status,

          admission_date:
            formData
              .admission_date ||
            null,

          user_id:
            editingStudent
              ?.user_id
              ? Number(
                  editingStudent
                    .user_id
                )
              : null,
        };


        if (
          editingStudent
        ) {

          await api.put(
            `/students/${editingStudent.id}`,
            payload
          );


          setSuccess(
            "Student details updated successfully."
          );

        } else {

          await api.post(
            "/students/",
            payload
          );


          setSuccess(
            "Student admission created successfully."
          );
        }


        await fetchStudents();


        closeForm();

      } catch (
        requestError
      ) {

        console.error(
          "Failed to save student:",
          requestError
        );


        setError(
          getApiErrorMessage(
            requestError,
            "Unable to save student."
          )
        );

      } finally {

        setSaving(
          false
        );
      }
    };


  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete =
    async (
      student
    ) => {

      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${student.name}?`
        );


      if (
        !confirmed
      ) {
        return;
      }


      try {

        setError("");

        setSuccess("");


        await api.delete(
          `/students/${student.id}`
        );


        setSuccess(
          "Student record deleted successfully."
        );


        await fetchStudents();

      } catch (
        requestError
      ) {

        console.error(
          "Failed to delete student:",
          requestError
        );


        setError(
          getApiErrorMessage(
            requestError,
            "Unable to delete student."
          )
        );
      }
    };


  // ==========================================
  // CLEAR FEATURE 9 FILTERS
  // ==========================================

  const clearFilters =
    () => {

      setSearch("");

      setAdmissionFilter(
        "All"
      );

      setCourseFilter(
        "All"
      );

      setDepartmentFilter(
        "All"
      );

      setYearFilter(
        "All"
      );

      setRoomFilter(
        "All"
      );

      setAccountFilter(
        "All"
      );

      setSortBy(
        "newest"
      );

      setCurrentPage(
        1
      );
    };


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-label">

              {isAdmin
                ? "ADMINISTRATION"
                : "WARDEN PORTAL"}

            </span>


            <h1>
              Students
            </h1>


            <p>
              Search, filter and manage
              hostel student records.
            </p>

          </div>


          <div className="dashboard-date">

            <span>
              TOTAL STUDENTS
            </span>

            <strong>
              {
                summary.total
              }
            </strong>

          </div>

        </header>


        {/* ALERTS */}

        {error && (

          <div className="students-message error">
            {error}
          </div>

        )}


        {success && (

          <div className="students-message success">
            {success}
          </div>

        )}


        {/* SUMMARY */}

        <section className="students-summary-grid">

          <div className="students-summary-card">

            <span>
              Total
            </span>

            <strong>
              {
                summary.total
              }
            </strong>

          </div>


          <div className="students-summary-card">

            <span>
              Admitted / Approved
            </span>

            <strong>
              {
                summary.admitted
              }
            </strong>

          </div>


          <div className="students-summary-card">

            <span>
              Pending
            </span>

            <strong>
              {
                summary.pending
              }
            </strong>

          </div>


          <div className="students-summary-card">

            <span>
              Room Allocated
            </span>

            <strong>
              {
                summary.allocated
              }
            </strong>

          </div>


          <div className="students-summary-card">

            <span>
              Accounts Linked
            </span>

            <strong>
              {
                summary.linked
              }
            </strong>

          </div>

        </section>


        {/* STUDENT MANAGEMENT */}

        <section className="overview-card students-management-card">

          <div className="overview-header">

            <div>

              <h2>
                Student Records
              </h2>

              <p>
                Admission and hostel
                student information.
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
                  : "+ New Admission"}

              </button>

            )}

          </div>


          {/* FORM */}

          {showForm && (

            <form
              className="student-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="student-form-title">

                <div>

                  <h3>

                    {editingStudent
                      ? "Edit Student Details"
                      : "New Student Admission"}

                  </h3>


                  <p>

                    {editingStudent
                      ? "Update admission and student information."
                      : "Enter admission details. HostelHub Student ID will be generated automatically."}

                  </p>

                </div>

              </div>


              <div className="student-form-grid">


                {editingStudent && (

                  <div className="form-group">

                    <label>
                      HostelHub Student ID
                    </label>

                    <input
                      type="text"
                      value={
                        editingStudent
                          .student_code ||
                        ""
                      }
                      disabled
                    />

                  </div>

                )}


                <div className="form-group">

                  <label>
                    Student Name
                  </label>

                  <input
                    name="name"
                    type="text"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Full name"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Student Email
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Email address"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Student Phone
                  </label>

                  <input
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Mobile number"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Course
                  </label>

                  <input
                    name="course"
                    type="text"
                    value={
                      formData.course
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: BE"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Department
                  </label>

                  <input
                    name="department"
                    type="text"
                    value={
                      formData
                        .department
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: CSE"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Academic Year
                  </label>

                  <input
                    name="year"
                    type="number"
                    min="1"
                    max="8"
                    value={
                      formData.year
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 2"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Semester
                  </label>

                  <input
                    name="semester"
                    type="number"
                    min="1"
                    max="12"
                    value={
                      formData
                        .semester
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 4"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Admission Date
                  </label>

                  <input
                    name="admission_date"
                    type="date"
                    value={
                      formData
                        .admission_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Admission Status
                  </label>

                  <select
                    name="admission_status"
                    value={
                      formData
                        .admission_status
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Approved">
                      Approved
                    </option>

                    <option value="Admitted">
                      Admitted
                    </option>

                    <option value="Rejected">
                      Rejected
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Room Preference
                  </label>

                  <select
                    name="room_preference"
                    value={
                      formData
                        .room_preference
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select preference
                    </option>

                    <option value="1-Sharing">
                      1-Sharing
                    </option>

                    <option value="2-Sharing">
                      2-Sharing
                    </option>

                    <option value="3-Sharing">
                      3-Sharing
                    </option>

                    <option value="4-Sharing">
                      4-Sharing
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Allocated Room
                  </label>

                  <input
                    type="text"
                    value={
                      editingStudent
                        ?.room_number ||
                      "Not allocated"
                    }
                    disabled
                  />

                  <small className="form-help">
                    Use Room Allocation or
                    Room Transfer to change rooms.
                  </small>

                </div>


                <div className="form-group">

                  <label>
                    Parent / Guardian Name
                  </label>

                  <input
                    name="parent_name"
                    type="text"
                    value={
                      formData
                        .parent_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Parent name"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Parent / Guardian Phone
                  </label>

                  <input
                    name="guardian_phone"
                    type="tel"
                    value={
                      formData
                        .guardian_phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Parent mobile"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Parent Email
                  </label>

                  <input
                    name="parent_email"
                    type="email"
                    value={
                      formData
                        .parent_email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Parent email"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Emergency Contact
                  </label>

                  <input
                    name="emergency_contact"
                    type="tel"
                    value={
                      formData
                        .emergency_contact
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Emergency contact"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Profile Photo URL
                  </label>

                  <input
                    name="profile_photo_url"
                    type="url"
                    value={
                      formData
                        .profile_photo_url
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional image URL"
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Permanent Address
                  </label>

                  <textarea
                    name="address"
                    rows="3"
                    value={
                      formData.address
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Permanent address"
                  />

                </div>

              </div>


              <div className="student-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    saving
                  }
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
                    : editingStudent
                    ? "Update Student"
                    : "Create Admission"}

                </button>

              </div>

            </form>

          )}

        </section>


        {/* FEATURE 9 — ADVANCED FILTERS */}

        <section className="overview-card students-search-card">

          <div className="students-search-header">

            <div>

              <span className="students-feature-label">
                FEATURE 9
              </span>

              <h2>
                Advanced Student Search
              </h2>

              <p>
                Search across student IDs,
                names, contacts, courses,
                rooms and parent details.
              </p>

            </div>


            <span className="students-results-badge">

              {
                filteredStudents
                  .length
              }
              {" "}
              result
              {
                filteredStudents
                  .length ===
                1
                  ? ""
                  : "s"
              }

            </span>

          </div>


          <div className="students-search-main">

            <span>
              ⌕
            </span>

            <input
              type="search"
              placeholder="Search name, HostelHub ID, email, phone, course, department, room, parent..."
              value={
                search
              }
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
              }
            />


            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>

            )}

          </div>


          <div className="students-filter-grid">

            <label>

              Admission

              <select
                value={
                  admissionFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setAdmissionFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Statuses
                </option>


                {admissionStatuses.map(
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


            <label>

              Course

              <select
                value={
                  courseFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setCourseFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Courses
                </option>


                {courses.map(
                  (
                    course
                  ) => (

                  <option
                    key={
                      course
                    }
                    value={
                      course
                    }
                  >
                    {course}
                  </option>

                  )
                )}

              </select>

            </label>


            <label>

              Department

              <select
                value={
                  departmentFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setDepartmentFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Departments
                </option>


                {departments.map(
                  (
                    department
                  ) => (

                  <option
                    key={
                      department
                    }
                    value={
                      department
                    }
                  >
                    {department}
                  </option>

                  )
                )}

              </select>

            </label>


            <label>

              Year

              <select
                value={
                  yearFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setYearFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Years
                </option>


                {years.map(
                  (
                    year
                  ) => (

                  <option
                    key={
                      year
                    }
                    value={
                      year
                    }
                  >
                    Year {year}
                  </option>

                  )
                )}

              </select>

            </label>


            <label>

              Room

              <select
                value={
                  roomFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setRoomFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Students
                </option>

                <option value="Allocated">
                  Room Allocated
                </option>

                <option value="Unallocated">
                  Not Allocated
                </option>

              </select>

            </label>


            <label>

              Account

              <select
                value={
                  accountFilter
                }
                onChange={
                  (
                    event
                  ) =>
                    setAccountFilter(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="All">
                  All Accounts
                </option>

                <option value="Linked">
                  Account Linked
                </option>

                <option value="Unlinked">
                  No Account
                </option>

              </select>

            </label>


            <label>

              Sort By

              <select
                value={
                  sortBy
                }
                onChange={
                  (
                    event
                  ) =>
                    setSortBy(
                      event
                        .target
                        .value
                    )
                }
              >

                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="name-asc">
                  Name A–Z
                </option>

                <option value="name-desc">
                  Name Z–A
                </option>

                <option value="code-asc">
                  Student ID
                </option>

                <option value="year-asc">
                  Year Low–High
                </option>

                <option value="year-desc">
                  Year High–Low
                </option>

              </select>

            </label>


            <button
              type="button"
              className="students-clear-filters"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>

          </div>

        </section>


        {/* STUDENT TABLE */}

        <section className="overview-card">

          {loading ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                ♙
              </div>

              <h3>
                Loading Students...
              </h3>

              <p>
                Loading hostel student records.
              </p>

            </div>

          ) : students.length ===
            0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                ♙
              </div>

              <h3>
                No Students Found
              </h3>

              <p>
                There are currently no student records.
              </p>

            </div>

          ) : filteredStudents.length ===
            0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                ⌕
              </div>

              <h3>
                No Matching Students
              </h3>

              <p>
                Change or clear the current search filters.
              </p>


              <button
                type="button"
                className="primary-button"
                onClick={
                  clearFilters
                }
              >
                Clear Filters
              </button>

            </div>

          ) : (

            <>

              <div className="students-table-card">

                <div className="students-table-wrapper">

                  <table className="students-table">

                    <thead>

                      <tr>
                        <th>
                          Student ID
                        </th>

                        <th>
                          Student
                        </th>

                        <th>
                          Contact
                        </th>

                        <th>
                          Academic
                        </th>

                        <th>
                          Room
                        </th>

                        <th>
                          Parent
                        </th>

                        <th>
                          Admission
                        </th>

                        <th>
                          Account
                        </th>

                        <th>
                          Actions
                        </th>
                      </tr>

                    </thead>


                    <tbody>

                      {paginatedStudents.map(
                        (
                          student
                        ) => (

                        <tr
                          key={
                            student.id
                          }
                        >

                          <td>

                            <strong className="student-code">
                              {
                                student.student_code ||
                                "—"
                              }
                            </strong>

                          </td>


                          <td>

                            <div className="student-cell">

                              <div className="student-mini-avatar">

                                {
                                  student.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                  "S"
                                }

                              </div>


                              <div>

                                <strong>
                                  {
                                    student.name
                                  }
                                </strong>

                                <small>
                                  {
                                    student.department ||
                                    student.course
                                  }
                                </small>

                              </div>

                            </div>

                          </td>


                          <td>

                            <div className="student-table-stack">

                              <span>
                                {
                                  student.email
                                }
                              </span>

                              <small>
                                {
                                  student.phone
                                }
                              </small>

                            </div>

                          </td>


                          <td>

                            <div className="student-table-stack">

                              <span>
                                {
                                  student.course
                                }
                              </span>

                              <small>
                                Year{" "}
                                {
                                  student.year
                                }

                                {
                                  student.semester
                                    ? ` · Sem ${student.semester}`
                                    : ""
                                }
                              </small>

                            </div>

                          </td>


                          <td>

                            {activeStudentIds.has(Number(student.id)) ? (

                              <span className="students-room-badge allocated">

                                ⌂{" "}
                                {
                                  student.room_number || "Allocated"
                                }

                              </span>

                            ) : (

                              <span className="students-room-badge unallocated">
                                Not allocated
                              </span>

                            )}

                          </td>


                          <td>

                            <div className="student-table-stack">

                              <span>
                                {
                                  student.parent_name ||
                                  "—"
                                }
                              </span>

                              <small>
                                {
                                  student.guardian_phone ||
                                  student.parent_email ||
                                  "No contact"
                                }
                              </small>

                            </div>

                          </td>


                          <td>

                            <div className="student-table-stack">

                              <span
                                className={
                                  `students-admission-status status-${String(
                                    student.admission_status ||
                                    ""
                                  )
                                    .toLowerCase()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                    )}`
                                }
                              >
                                {
                                  student.admission_status
                                }
                              </span>

                              <small>
                                {
                                  formatDate(
                                    student.admission_date
                                  )
                                }
                              </small>

                            </div>

                          </td>


                          <td>

                            <span
                              className={
                                student.user_id
                                  ? "student-status linked"
                                  : "student-status not-linked"
                              }
                            >

                              {student.user_id
                                ? "Linked"
                                : "No Account"}

                            </span>

                          </td>


                          <td>

                            <div className="student-actions">

                              <button
                                type="button"
                                className="student-action-button edit"
                                onClick={() =>
                                  openEditForm(
                                    student
                                  )
                                }
                              >
                                Edit
                              </button>


                              {isAdmin && (

                                <button
                                  type="button"
                                  className="student-action-button delete"
                                  onClick={() =>
                                    handleDelete(
                                      student
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                totalItems={
                  filteredStudents
                    .length
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

      </main>

    </div>
  );
}


export default Students;