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


function todayValue() {
  const now =
    new Date();

  const local =
    new Date(
      now.getTime()
      - now.getTimezoneOffset()
      * 60000
    );

  return local
    .toISOString()
    .split("T")[0];
}


function StudentAttendance() {
  const [records, setRecords] =
    useState([]);

  const [error, setError] =
    useState("");


  useEffect(() => {
    api.get(
      "/attendance/my-attendance"
    )
      .then(
        (response) =>
          setRecords(
            response.data
          )
      )
      .catch(
        (error) =>
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load attendance."
          )
      );
  }, []);


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            STUDENT ATTENDANCE
          </span>

          <h1>
            My Attendance
          </h1>

          <p>
            View your hostel attendance.
          </p>
        </div>
      </header>


      {error && (
        <div className="attendance-error">
          <p>
            {error}
          </p>
        </div>
      )}


      <section className="overview-card">
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {records.map(
                (record) => (
                  <tr key={record.id}>
                    <td>
                      {record.attendance_date}
                    </td>

                    <td>
                      {record.status}
                    </td>

                    <td>
                      {record.remarks
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
  );
}


function AdminAttendance() {
  const [records, setRecords] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [error, setError] =
    useState("");


  useEffect(() => {
    Promise.all([
      api.get(
        "/attendance/"
      ),

      api.get(
        "/students/"
      ),
    ])
      .then(
        ([
          attendanceResponse,
          studentResponse,
        ]) => {
          setRecords(
            attendanceResponse.data
          );

          setStudents(
            studentResponse.data
          );
        }
      )
      .catch(
        (error) =>
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load attendance."
          )
      );
  }, []);


  const studentName =
    (id) => {
      const student =
        students.find(
          (item) =>
            item.id === id
        );

      return student
        ? student.name
        : `Student #${id}`;
    };


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            ADMIN MONITORING
          </span>

          <h1>
            Attendance
          </h1>

          <p>
            Monitor attendance recorded
            by Wardens.
          </p>
        </div>
      </header>


      {error && (
        <div className="attendance-error">
          <p>
            {error}
          </p>
        </div>
      )}


      <section className="overview-card">
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {records.map(
                (record) => (
                  <tr key={record.id}>
                    <td>
                      {studentName(
                        record.student_id
                      )}
                    </td>

                    <td>
                      {record.attendance_date}
                    </td>

                    <td>
                      {record.status}
                    </td>

                    <td>
                      {record.remarks
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
  );
}


function WardenAttendance() {
  const [blocks, setBlocks] =
    useState([]);

  const [block, setBlock] =
    useState("");

  const [floor, setFloor] =
    useState("");

  const [attendanceDate, setAttendanceDate] =
    useState(
      todayValue()
    );

  const [students, setStudents] =
    useState([]);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  useEffect(() => {
    api.get(
      "/attendance/blocks"
    )
      .then(
        (response) => {
          setBlocks(
            response.data
          );

          if (
            response.data.length
            > 0
          ) {
            setBlock(
              response.data[0].block
            );
          }
        }
      )
      .catch(
        (error) =>
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load blocks."
          )
      );
  }, []);


  const loadRoster =
    useCallback(
      async () => {
        if (!block) {
          return;
        }

        const params =
          new URLSearchParams();

        params.set(
          "block",
          block
        );

        params.set(
          "attendance_date",
          attendanceDate
        );

        if (floor) {
          params.set(
            "floor",
            floor
          );
        }

        try {
          const response =
            await api.get(
              `/attendance/roster?${params.toString()}`
            );

          setStudents(
            response.data.map(
              (student) => ({
                ...student,

                status:
                  student.status
                  || "Present",

                remarks:
                  student.remarks
                  || "",
              })
            )
          );

        } catch (error) {
          setError(
            error.response
              ?.data
              ?.detail
            ||
            "Unable to load roster."
          );
        }
      },
      [
        block,
        floor,
        attendanceDate,
      ]
    );


  useEffect(() => {
    loadRoster();
  }, [loadRoster]);


  const floors =
    blocks.find(
      (item) =>
        item.block === block
    )?.floors || [];


  const updateStudent =
    (
      studentId,
      field,
      value
    ) => {
      setStudents(
        (current) =>
          current.map(
            (student) =>
              student.student_id
              === studentId
                ? {
                    ...student,

                    [field]:
                      value,
                  }
                : student
          )
      );
    };


  const markAllPresent =
    () => {
      setStudents(
        (current) =>
          current.map(
            (student) => ({
              ...student,

              status:
                "Present",
            })
          )
      );
    };


  const save =
    async () => {
      try {
        setError("");
        setSuccess("");

        const response =
          await api.post(
            "/attendance/bulk",
            {
              block,

              floor:
                floor
                  ? Number(floor)
                  : null,

              attendance_date:
                attendanceDate,

              entries:
                students.map(
                  (student) => ({
                    student_id:
                      student.student_id,

                    status:
                      student.status,

                    remarks:
                      student.remarks
                      || null,
                  })
                ),
            }
          );

        setSuccess(
          `${response.data.updated} attendance records saved.`
        );

        await loadRoster();

      } catch (error) {
        setError(
          error.response
            ?.data
            ?.detail
          ||
          "Unable to save attendance."
        );
      }
    };


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            WARDEN ATTENDANCE
          </span>

          <h1>
            Block Attendance
          </h1>

          <p>
            Select block, floor and date,
            then mark attendance.
          </p>
        </div>
      </header>


      {error && (
        <div className="attendance-error">
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

            color:
              "#067647",

            background:
              "#ecfdf3",

            borderRadius:
              "10px",
          }}
        >
          {success}
        </div>
      )}


      <section className="overview-card">
        <div className="attendance-form-grid">
          <div className="form-group">
            <label>
              Block
            </label>

            <select
              value={block}
              onChange={
                (event) => {
                  setBlock(
                    event.target.value
                  );

                  setFloor("");
                }
              }
            >
              {blocks.map(
                (item) => (
                  <option
                    key={
                      item.block
                    }
                    value={
                      item.block
                    }
                  >
                    {item.block}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>
              Floor
            </label>

            <select
              value={floor}
              onChange={
                (event) =>
                  setFloor(
                    event.target.value
                  )
              }
            >
              <option value="">
                All Floors
              </option>

              {floors.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Floor {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>
              Date
            </label>

            <input
              type="date"
              value={
                attendanceDate
              }
              onChange={
                (event) =>
                  setAttendanceDate(
                    event.target.value
                  )
              }
            />
          </div>
        </div>

        <div
          style={{
            display:
              "flex",

            gap:
              "12px",

            marginTop:
              "18px",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={
              markAllPresent
            }
          >
            Mark All Present
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={save}
          >
            Save Attendance
          </button>
        </div>
      </section>


      <section
        className="overview-card"
        style={{
          marginTop:
            "22px",
        }}
      >
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Room</th>
                <th>Floor</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {students.map(
                (student) => (
                  <tr
                    key={
                      student.student_id
                    }
                  >
                    <td>
                      {student.student_code
                        || student.student_id}
                    </td>

                    <td>
                      {student.student_name}
                    </td>

                    <td>
                      {student.room_number
                        || "-"}
                    </td>

                    <td>
                      {student.floor}
                    </td>

                    <td>
                      <select
                        value={
                          student.status
                        }
                        onChange={
                          (event) =>
                            updateStudent(
                              student.student_id,
                              "status",
                              event.target.value
                            )
                        }
                      >
                        <option>
                          Present
                        </option>

                        <option>
                          Absent
                        </option>

                        <option>
                          Leave
                        </option>
                      </select>
                    </td>

                    <td>
                      <input
                        value={
                          student.remarks
                        }
                        onChange={
                          (event) =>
                            updateStudent(
                              student.student_id,
                              "remarks",
                              event.target.value
                            )
                        }
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}


function Attendance() {
  const role =
    roleFromToken();

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {role === "Student" && (
          <StudentAttendance />
        )}

        {role === "Admin" && (
          <AdminAttendance />
        )}

        {role === "Warden" && (
          <WardenAttendance />
        )}
      </main>
    </div>
  );
}


export default Attendance;