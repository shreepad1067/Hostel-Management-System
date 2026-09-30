import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Html5Qrcode,
} from "html5-qrcode";

import {
  QRCodeSVG,
} from "qrcode.react";

import Sidebar from "../components/Sidebar";

import "../components/Sidebar.css";
import "./MealTracking.css";

import api from "../services/api";


const MEALS = [
  {
    name: "Breakfast",
    icon: "☀",
  },
  {
    name: "Lunch",
    icon: "🍚",
  },
  {
    name: "Snacks",
    icon: "☕",
  },
  {
    name: "Dinner",
    icon: "🌙",
  },
];


function getRole() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return null;
    }

    return JSON.parse(
      atob(
        token.split(".")[1]
      )
    ).role;

  } catch {
    return null;
  }
}


function localDate() {
  const now = new Date();

  const date = new Date(
    now.getTime()
    - now.getTimezoneOffset()
    * 60000
  );

  return date
    .toISOString()
    .split("T")[0];
}


function errorText(
  error,
  fallback
) {
  return (
    error.response
      ?.data
      ?.detail
    || fallback
  );
}


function timeText(value) {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleTimeString(
    "en-IN",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}


function StudentMealView() {
  const scannerRef =
    useRef(null);

  const scanLock =
    useRef(false);

  const [todayRecords, setTodayRecords] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [scanning, setScanning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const load =
    useCallback(
      async () => {
        try {
          const [
            todayResponse,
            historyResponse,
          ] = await Promise.all([
            api.get(
              "/meals/my-today"
            ),

            api.get(
              "/meals/my-history?limit=50"
            ),
          ]);

          setTodayRecords(
            todayResponse.data
          );

          setHistory(
            historyResponse.data
          );

        } catch (error) {
          setError(
            errorText(
              error,
              "Unable to load meal records."
            )
          );
        }
      },
      []
    );


  useEffect(() => {
    load();

    return () => {
      if (
        scannerRef.current
      ) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, [load]);


  const submitQR =
    async (token) => {
      try {
        setError("");
        setSuccess("");

        await api.post(
          "/meals/scan",
          {
            qr_token:
              token,
          }
        );

        setSuccess(
          "Meal collected successfully."
        );

        await load();

      } catch (error) {
        setError(
          errorText(
            error,
            "Unable to confirm meal."
          )
        );

      } finally {
        scanLock.current = false;
      }
    };


  const startScanner =
    async () => {
      try {
        setError("");
        setSuccess("");

        scanLock.current = false;

        const scanner =
          new Html5Qrcode(
            "meal-qr-reader"
          );

        scannerRef.current =
          scanner;

        setScanning(true);

        await scanner.start(
          {
            facingMode:
              "environment",
          },

          {
            fps: 10,

            qrbox: {
              width: 240,
              height: 240,
            },
          },

          async (
            decodedText
          ) => {
            if (
              scanLock.current
            ) {
              return;
            }

            scanLock.current = true;

            try {
              await scanner.stop();

            } catch {
              // Ignore scanner stop errors.
            }

            setScanning(false);

            await submitQR(
              decodedText
            );
          },

          () => {}
        );

      } catch {
        setScanning(false);

        setError(
          "Unable to open camera. Allow camera permission and try again."
        );
      }
    };


  const stopScanner =
    async () => {
      try {
        if (
          scannerRef.current
        ) {
          await scannerRef.current
            .stop();
        }

      } catch {
        // Ignore scanner stop errors.
      }

      setScanning(false);
    };


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            STUDENT DINING
          </span>

          <h1>
            Meal Tracking
          </h1>

          <p>
            Scan the Warden's meal QR
            when collecting your food.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            TODAY
          </span>

          <strong>
            {todayRecords.length}/4
          </strong>
        </div>
      </header>


      {error && (
        <div className="meal-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="meal-message success">
          {success}
        </div>
      )}


      <section className="overview-card">
        <div className="meal-section-heading">
          <div>
            <h2>
              Scan Dining QR
            </h2>

            <p>
              QR codes expire automatically
              after a short time.
            </p>
          </div>
        </div>

        <div
          id="meal-qr-reader"
          style={{
            maxWidth:
              "450px",

            margin:
              "22px auto",
          }}
        />

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "center",

            gap:
              "12px",
          }}
        >
          {!scanning ? (
            <button
              type="button"
              className="primary-button"
              onClick={
                startScanner
              }
            >
              Start QR Scanner
            </button>

          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={
                stopScanner
              }
            >
              Stop Scanner
            </button>
          )}
        </div>
      </section>


      <section
        className="overview-card"
        style={{
          marginTop:
            "22px",
        }}
      >
        <div className="meal-card-grid">
          {MEALS.map(
            (meal) => {
              const record =
                todayRecords.find(
                  (item) =>
                    item.meal_type
                    === meal.name
                );

              return (
                <article
                  key={
                    meal.name
                  }
                  className={
                    record
                      ? "meal-card confirmed"
                      : "meal-card"
                  }
                >
                  <div className="meal-card-icon">
                    {meal.icon}
                  </div>

                  <h3>
                    {meal.name}
                  </h3>

                  {record ? (
                    <>
                      <div className="meal-confirmed-label">
                        ✓ Collected
                      </div>

                      <small>
                        {timeText(
                          record.confirmed_at
                        )}
                      </small>
                    </>
                  ) : (
                    <p>
                      Not collected.
                    </p>
                  )}
                </article>
              );
            }
          )}
        </div>
      </section>


      <section className="overview-card meal-history-section">
        <h2>
          Meal History
        </h2>

        {history.length === 0 ? (
          <div className="meal-empty">
            No meal history yet.
          </div>

        ) : (
          <div className="meal-table-wrapper">
            <table className="meal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {history.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        {record.meal_date}
                      </td>

                      <td>
                        {record.meal_type}
                      </td>

                      <td>
                        {record.status}
                      </td>

                      <td>
                        {timeText(
                          record.confirmed_at
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
    </>
  );
}


function ManagementMealView({
  role,
}) {
  const [records, setRecords] =
    useState([]);

  const [selectedDate, setSelectedDate] =
    useState(
      localDate()
    );

  const [selectedMeal, setSelectedMeal] =
    useState("");

  const [qrMeal, setQrMeal] =
    useState("Breakfast");

  const [qrData, setQrData] =
    useState(null);

  const [remaining, setRemaining] =
    useState(0);

  const [error, setError] =
    useState("");


  const loadRecords =
    useCallback(
      async () => {
        try {
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "meal_date",
            selectedDate
          );

          if (selectedMeal) {
            params.set(
              "meal_type",
              selectedMeal
            );
          }

          const response =
            await api.get(
              `/meals/records?${params.toString()}`
            );

          setRecords(
            response.data
          );

        } catch (error) {
          setError(
            errorText(
              error,
              "Unable to load meal records."
            )
          );
        }
      },
      [
        selectedDate,
        selectedMeal,
      ]
    );


  useEffect(() => {
    loadRecords();
  }, [loadRecords]);


  useEffect(() => {
    if (
      !qrData
      || remaining <= 0
    ) {
      return;
    }

    const timer =
      setInterval(
        () => {
          setRemaining(
            (value) =>
              Math.max(
                0,
                value - 1
              )
          );
        },
        1000
      );

    return () =>
      clearInterval(
        timer
      );

  }, [
    qrData,
    remaining,
  ]);


  const generateQR =
    async () => {
      try {
        setError("");

        const response =
          await api.post(
            "/meals/qr/generate",
            {
              meal_type:
                qrMeal,

              duration_seconds:
                90,
            }
          );

        setQrData(
          response.data
        );

        setRemaining(
          90
        );

      } catch (error) {
        setError(
          errorText(
            error,
            "Unable to generate meal QR."
          )
        );
      }
    };


  return (
    <>
      <header className="dashboard-header">
        <div>
          <span className="dashboard-label">
            {role === "Warden"
              ? "WARDEN DINING"
              : "ADMIN MONITORING"}
          </span>

          <h1>
            Meal Tracking
          </h1>

          <p>
            Monitor student meal
            collections.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            RECORDS
          </span>

          <strong>
            {records.length}
          </strong>
        </div>
      </header>


      {error && (
        <div className="meal-message error">
          {error}
        </div>
      )}


      {role === "Warden" && (
        <section className="overview-card">
          <h2>
            Generate Meal QR
          </h2>

          <p>
            Generate a 90-second QR
            for the meal currently
            being served.
          </p>

          <div
            style={{
              display:
                "flex",

              gap:
                "12px",

              flexWrap:
                "wrap",

              marginTop:
                "18px",
            }}
          >
            <select
              value={
                qrMeal
              }
              onChange={
                (event) =>
                  setQrMeal(
                    event.target.value
                  )
              }
            >
              {MEALS.map(
                (meal) => (
                  <option
                    key={
                      meal.name
                    }
                    value={
                      meal.name
                    }
                  >
                    {meal.name}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="primary-button"
              onClick={
                generateQR
              }
            >
              Generate QR
            </button>
          </div>


          {qrData && (
            <div
              style={{
                width:
                  "fit-content",

                margin:
                  "28px auto 0",

                padding:
                  "24px",

                background:
                  "#ffffff",

                border:
                  "1px solid #e2e8f0",

                borderRadius:
                  "18px",

                textAlign:
                  "center",
              }}
            >
              <QRCodeSVG
                value={
                  qrData.qr_token
                }
                size={260}
                level="H"
              />

              <h3>
                {qrData.meal_type}
              </h3>

              {remaining > 0 ? (
                <p>
                  Expires in{" "}
                  <strong>
                    {remaining}s
                  </strong>
                </p>

              ) : (
                <p
                  style={{
                    color:
                      "#b42318",
                  }}
                >
                  QR expired.
                </p>
              )}
            </div>
          )}
        </section>
      )}


      <section
        className="overview-card"
        style={{
          marginTop:
            "22px",
        }}
      >
        <div className="meal-filter-row">
          <div className="meal-filter">
            <label>
              Date
            </label>

            <input
              type="date"
              value={
                selectedDate
              }
              onChange={
                (event) =>
                  setSelectedDate(
                    event.target.value
                  )
              }
            />
          </div>

          <div className="meal-filter">
            <label>
              Meal
            </label>

            <select
              value={
                selectedMeal
              }
              onChange={
                (event) =>
                  setSelectedMeal(
                    event.target.value
                  )
              }
            >
              <option value="">
                All Meals
              </option>

              {MEALS.map(
                (meal) => (
                  <option
                    key={
                      meal.name
                    }
                    value={
                      meal.name
                    }
                  >
                    {meal.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>


      <section className="overview-card meal-history-section">
        {records.length === 0 ? (
          <div className="meal-empty">
            No records found.
          </div>

        ) : (
          <div className="meal-table-wrapper">
            <table className="meal-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {records.map(
                  (record) => (
                    <tr key={record.id}>
                      <td>
                        {record.student_code
                          || record.student_id}
                      </td>

                      <td>
                        {record.student_name}
                      </td>

                      <td>
                        {record.meal_date}
                      </td>

                      <td>
                        {record.meal_type}
                      </td>

                      <td>
                        {record.status}
                      </td>

                      <td>
                        {timeText(
                          record.confirmed_at
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
    </>
  );
}


function MealTracking() {
  const role =
    getRole();

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {role === "Student" ? (
          <StudentMealView />

        ) : (
          <ManagementMealView
            role={role}
          />
        )}
      </main>
    </div>
  );
}


export default MealTracking;