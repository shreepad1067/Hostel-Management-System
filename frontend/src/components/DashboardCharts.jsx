import "./DashboardCharts.css";


function safeNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


// ==============================================
// DONUT CHART
// ==============================================

export function DonutChart({
  value = 0,
  total = 0,
  label = "",
  sublabel = "",
}) {
  const safeValue =
    safeNumber(
      value
    );

  const safeTotal =
    safeNumber(
      total
    );

  const percentage =
    safeTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              safeValue /
              safeTotal
            ) *
              100
          )
        )
      : 0;


  const radius =
    47;

  const circumference =
    2 *
    Math.PI *
    radius;

  const offset =
    circumference -
    (
      percentage /
      100
    ) *
      circumference;


  return (
    <div className="dashboard-donut">

      <div className="dashboard-donut-svg-wrap">

        <svg
          viewBox="0 0 120 120"
          className="dashboard-donut-svg"
          aria-hidden="true"
        >

          <circle
            cx="60"
            cy="60"
            r={radius}
            className="dashboard-donut-track"
          />


          <circle
            cx="60"
            cy="60"
            r={radius}
            className="dashboard-donut-progress"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              offset
            }
          />

        </svg>


        <div className="dashboard-donut-center">

          <strong>
            {
              Math.round(
                percentage
              )
            }
            %
          </strong>

          <span>
            {label}
          </span>

        </div>

      </div>


      {sublabel && (

        <p className="dashboard-donut-caption">
          {sublabel}
        </p>

      )}

    </div>
  );
}


// ==============================================
// HORIZONTAL BAR
// ==============================================

export function MetricBar({
  label,
  value,
  total,
  suffix = "",
}) {
  const safeValue =
    safeNumber(
      value
    );

  const safeTotal =
    safeNumber(
      total
    );

  const percentage =
    safeTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              safeValue /
              safeTotal
            ) *
              100
          )
        )
      : 0;


  return (
    <div className="dashboard-metric-bar">

      <div className="dashboard-metric-bar-header">

        <span>
          {label}
        </span>

        <strong>
          {safeValue}
          {suffix}
        </strong>

      </div>


      <div className="dashboard-metric-bar-track">

        <div
          className="dashboard-metric-bar-fill"
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


// ==============================================
// MULTI BAR CHART
// ==============================================

export function MiniBarChart({
  data = [],
}) {
  const maxValue =
    Math.max(
      1,
      ...data.map(
        (
          item
        ) =>
          safeNumber(
            item.value
          )
      )
    );


  return (
    <div className="dashboard-mini-bars">

      {data.map(
        (
          item
        ) => {

        const value =
          safeNumber(
            item.value
          );


        const height =
          Math.max(
            value > 0
              ? 8
              : 0,
            (
              value /
              maxValue
            ) *
              100
          );


        return (

          <div
            key={
              item.label
            }
            className="dashboard-mini-bar-item"
          >

            <div className="dashboard-mini-bar-number">
              {value}
            </div>


            <div className="dashboard-mini-bar-column">

              <div
                className="dashboard-mini-bar-fill"
                style={{
                  height:
                    `${height}%`,
                }}
              />

            </div>


            <span>
              {item.label}
            </span>

          </div>

        );
        }
      )}

    </div>
  );
}


// ==============================================
// PROGRESS
// ==============================================

export function ProgressMetric({
  title,
  value,
  total,
  valueLabel,
  helper,
}) {
  const safeValue =
    safeNumber(
      value
    );

  const safeTotal =
    safeNumber(
      total
    );

  const percentage =
    safeTotal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              safeValue /
              safeTotal
            ) *
              100
          )
        )
      : 0;


  return (
    <div className="dashboard-progress-metric">

      <div className="dashboard-progress-heading">

        <div>

          <span>
            {title}
          </span>

          {helper && (
            <small>
              {helper}
            </small>
          )}

        </div>


        <strong>

          {valueLabel ??
            `${Math.round(
              percentage
            )}%`}

        </strong>

      </div>


      <div className="dashboard-progress-track">

        <div
          className="dashboard-progress-fill"
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}