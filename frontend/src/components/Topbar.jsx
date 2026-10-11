import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

import "./Topbar.css";


function decodeToken() {
  try {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return {};
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
    );

  } catch {
    return {};
  }
}


// ==============================================
// NOTIFICATION ICON
// ==============================================

function notificationIcon(
  category
) {
  const value =
    String(
      category || ""
    ).toLowerCase();


  if (
    value.includes("fee") ||
    value.includes("payment")
  ) {
    return "₹";
  }


  if (
    value.includes("transfer")
  ) {
    return "⇄";
  }


  if (
    value.includes("maintenance")
  ) {
    return "⚙";
  }


  if (
    value.includes("room")
  ) {
    return "⌂";
  }


  if (
    value.includes("meal") ||
    value.includes("food")
  ) {
    return "🍽";
  }


  if (
    value.includes("sos") ||
    value.includes("emergency")
  ) {
    return "🚨";
  }


  if (
    value.includes("complaint")
  ) {
    return "⚠";
  }


  if (
    value.includes("notice")
  ) {
    return "◉";
  }


  if (
    value.includes("leave")
  ) {
    return "▤";
  }


  if (
    value.includes("visitor")
  ) {
    return "♙";
  }


  return "🔔";
}


// ==============================================
// TIME AGO
// ==============================================

function timeAgo(
  value
) {
  if (!value) {
    return "";
  }


  const date =
    new Date(value);

  const now =
    new Date();


  const seconds =
    Math.floor(
      (
        now.getTime() -
        date.getTime()
      ) /
      1000
    );


  if (
    seconds < 60
  ) {
    return "Just now";
  }


  const minutes =
    Math.floor(
      seconds /
      60
    );


  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }


  const hours =
    Math.floor(
      minutes /
      60
    );


  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }


  const days =
    Math.floor(
      hours /
      24
    );


  if (
    days < 7
  ) {
    return `${days}d ago`;
  }


  return date.toLocaleDateString(
    "en-IN"
  );
}


// ==============================================
// GLOBAL SEARCH CATALOG
// ==============================================

const PAGE_CATALOG = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "▦",

    description:
      "Hostel overview and dashboard",

    keywords:
      "dashboard home overview hostel summary statistics",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Notifications",
    path: "/notifications",
    icon: "🔔",

    description:
      "View HostelHub notifications",

    keywords:
      "notification notifications alerts updates messages",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Account Management",
    path: "/accounts",
    icon: "♜",

    description:
      "Manage HostelHub user accounts",

    keywords:
      "account accounts users credentials login password",

    roles: [
      "Admin",
    ],
  },

  {
    name: "Audit Log",
    path: "/audit-logs",
    icon: "≡",

    description:
      "Review HostelHub system activity",

    keywords:
      "audit log logs activity history security changes admin actions events trail",

    roles: [
      "Admin",
    ],
  },

  {
    name: "Students",
    path: "/students",
    icon: "♙",

    description:
      "Manage student records",

    keywords:
      "student students resident admission records",

    roles: [
      "Admin",
      "Warden",
    ],
  },

  // ==========================================
  {
    name: "Rooms",
    path: "/rooms",
    icon: "⌂",

    description:
      "Rooms and bed visualization",

    keywords:
      "room rooms bed block floor available occupied capacity",

    roles: [
      "Admin",
      "Warden",
    ],
  },

  {
    name: "Room Allocation",
    path: "/room-allocation",
    icon: "▣",

    description:
      "Allocate hostel rooms",

    keywords:
      "allocation assign allot room student bed",

    roles: [
      "Admin",
      "Warden",
    ],
  },

  {
    name: "Room Transfer",
    path: "/room-transfer",
    icon: "⇄",

    description:
      "Room change and transfer requests",

    keywords:
      "room transfer change shift move request",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Maintenance",
    path: "/maintenance",
    icon: "⚙",

    description:
      "Hostel repair and maintenance",

    keywords:
      "maintenance repair work order electrical plumbing cleaning wifi",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Fees",
    path: "/fees",
    icon: "₹",

    description:
      "Manage fees, payments and receipts",

    keywords:
      "fees fee payment receipt pdf finance",

    roles: [
      "Admin",
      "Warden",
    ],
  },

  {
    name: "My Profile",
    path: "/profile",
    icon: "👤",

    description:
      "Student profile information",

    keywords:
      "profile personal student information details",

    roles: [
      "Student",
    ],
  },

  {
    name: "My Room",
    path: "/my-room",
    icon: "⌂",

    description:
      "View allocated hostel room",

    keywords:
      "my room bed allocation hostel",

    roles: [
      "Student",
    ],
  },

  {
    name: "My Fees",
    path: "/my-fees",
    icon: "₹",

    description:
      "Fees, payments and PDF receipts",

    keywords:
      "my fees payment receipt pdf paid pending",

    roles: [
      "Student",
    ],
  },

  {
    name: "Meal Tracking",
    path: "/meal-tracking",
    icon: "🍽",

    description:
      "Track hostel meals",

    keywords:
      "meal meals qr breakfast lunch dinner food mess",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Food Menu",
    path: "/food-menu",
    icon: "☷",

    description:
      "View hostel food menu",

    keywords:
      "food menu mess breakfast lunch dinner",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Food Feedback",
    path: "/food-feedback",
    icon: "★",

    description:
      "Food ratings and feedback",

    keywords:
      "food feedback rating review mess meal",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "SOS / Emergency",
    path: "/sos",
    icon: "🚨",

    description:
      "Emergency and SOS alerts",

    keywords:
      "sos emergency urgent help danger security alert",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "AI Center",
    path: "/ai",
    icon: "✦",

    description:
      "HostelHub AI tools",

    keywords:
      "ai assistant artificial intelligence smart center",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Attendance",
    path: "/attendance",
    icon: "✓",

    description:
      "Hostel attendance records",

    keywords:
      "attendance present absent daily records",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Complaints",
    path: "/complaints",
    icon: "⚠",

    description:
      "Hostel complaints",

    keywords:
      "complaint complaints grievance issue problem report",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Leave",
    path: "/leave",
    icon: "▤",

    description:
      "Hostel leave requests",

    keywords:
      "leave holiday permission outpass request",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Visitors",
    path: "/visitors",
    icon: "♙",

    description:
      "Visitors and QR visitor passes",

    keywords:
      "visitor guest qr pass scan gate checkin checkout",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Notices",
    path: "/notices",
    icon: "◉",

    description:
      "Hostel notices and announcements",

    keywords:
      "notice notices announcement news",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },

  {
    name: "Website Feedback",
    path: "/website-feedback",
    icon: "✎",

    description:
      "HostelHub feedback",

    keywords:
      "website feedback suggestion review bug",

    roles: [
      "Admin",
      "Student",
    ],
  },

  {
    name: "About Hostel",
    path: "/about-hostel",
    icon: "⌂",

    description:
      "Hostel details and information",

    keywords:
      "about hostel information rules contact",

    roles: [
      "Admin",
      "Warden",
      "Student",
    ],
  },
];


function normalizeText(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}


// ==============================================
// TOPBAR
// ==============================================

function Topbar() {
  const navigate =
    useNavigate();

  const wrapperRef =
    useRef(null);

  const payload =
    decodeToken();

  const role =
    payload.role ||
    "User";


  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);


  // ==============================================
  // ROLE-BASED SEARCH
  // ==============================================

  const searchablePages =
    useMemo(
      () =>
        PAGE_CATALOG.filter(
          (
            page
          ) =>
            page.roles.includes(
              role
            )
        ),
      [role]
    );


  // ==============================================
  // SEARCH RESULTS
  // ==============================================

  const suggestions =
    useMemo(
      () => {

        const query =
          normalizeText(
            search
          );


        if (!query) {
          return searchablePages.slice(
            0,
            8
          );
        }


        const words =
          query
            .split(/\s+/)
            .filter(Boolean);


        return searchablePages
          .map(
            (
              page
            ) => {

              const name =
                normalizeText(
                  page.name
                );

              const keywords =
                normalizeText(
                  page.keywords
                );

              const description =
                normalizeText(
                  page.description
                );

              const combined =
                `${name} ${keywords} ${description}`;


              const matchesAll =
                words.every(
                  (
                    word
                  ) =>
                    combined.includes(
                      word
                    )
                );


              if (!matchesAll) {
                return null;
              }


              let score = 0;


              if (
                name === query
              ) {
                score += 100;
              }


              if (
                name.startsWith(
                  query
                )
              ) {
                score += 60;
              }


              if (
                name.includes(
                  query
                )
              ) {
                score += 40;
              }


              words.forEach(
                (
                  word
                ) => {

                  if (
                    name.includes(
                      word
                    )
                  ) {
                    score += 10;
                  }


                  if (
                    keywords.includes(
                      word
                    )
                  ) {
                    score += 5;
                  }

                }
              );


              return {
                ...page,
                score,
              };
            }
          )
          .filter(Boolean)
          .sort(
            (
              first,
              second
            ) =>
              second.score -
              first.score
          )
          .slice(
            0,
            8
          );
      },
      [
        search,
        searchablePages,
      ]
    );


  // ==============================================
  // NOTIFICATIONS
  // ==============================================

  const loadNotifications =
    useCallback(
      async () => {

        try {

          const [
            notificationResponse,
            countResponse,
          ] =
            await Promise.all([
              api.get(
                "/notifications/?limit=5"
              ),

              api.get(
                "/notifications/unread-count"
              ),
            ]);


          setNotifications(
            Array.isArray(
              notificationResponse.data
            )
              ? notificationResponse.data
              : []
          );


          setUnreadCount(
            countResponse
              .data
              ?.unread_count ||
            0
          );

        } catch {

          setNotifications([]);

          setUnreadCount(0);
        }
      },
      []
    );


  useEffect(() => {

    loadNotifications();


    const interval =
      window.setInterval(
        loadNotifications,
        30000
      );


    return () =>
      window.clearInterval(
        interval
      );

  }, [
    loadNotifications,
  ]);


  // ==============================================
  // CLICK OUTSIDE
  // ==============================================

  useEffect(() => {

    const handleOutside =
      (
        event
      ) => {

        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(
            event.target
          )
        ) {
          setNotificationOpen(
            false
          );

          setSearchOpen(
            false
          );
        }
      };


    document.addEventListener(
      "mousedown",
      handleOutside
    );


    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside
      );

  }, []);


  // ==============================================
  // OPEN PAGE
  // ==============================================

  const openPage =
    (
      path
    ) => {

      navigate(path);

      setSearch("");

      setSearchOpen(false);
    };


  // ==============================================
  // SEARCH SUBMIT
  // ==============================================

  const handleSearch =
    (
      event
    ) => {

      event.preventDefault();


      if (
        suggestions.length ===
        0
      ) {
        return;
      }


      openPage(
        suggestions[0].path
      );
    };


  // ==============================================
  // OPEN NOTIFICATION
  // ==============================================

  const openNotification =
    async (
      notification
    ) => {

      try {

        if (
          !notification.is_read
        ) {
          await api.put(
            `/notifications/${notification.id}/read`
          );
        }

      } catch {
        // Navigation continues.
      }


      setNotificationOpen(
        false
      );


      await loadNotifications();


      if (
        notification.link
      ) {
        navigate(
          notification.link
        );

      } else {
        navigate(
          "/notifications"
        );
      }
    };


  // ==============================================
  // MARK ALL READ
  // ==============================================

  const markAllRead =
    async () => {

      try {

        await api.put(
          "/notifications/read-all"
        );

        await loadNotifications();

      } catch {
        // Ignore notification refresh errors.
      }
    };


  return (
    <header
      className="hostel-topbar"
      ref={
        wrapperRef
      }
    >

      {/* GLOBAL SEARCH */}

      <div className="hostel-topbar-search-area">

        <form
          className="hostel-topbar-search"
          onSubmit={
            handleSearch
          }
        >

          <span className="topbar-search-icon">
            ⌕
          </span>


          <input
            type="search"
            value={
              search
            }
            onChange={
              (
                event
              ) => {

                setSearch(
                  event.target.value
                );

                setSearchOpen(
                  true
                );
              }
            }
            onFocus={() =>
              setSearchOpen(
                true
              )
            }
            onKeyDown={
              (
                event
              ) => {

                if (
                  event.key ===
                  "Escape"
                ) {
                  setSearchOpen(
                    false
                  );
                }
              }
            }
            placeholder="Search any HostelHub page..."
            autoComplete="off"
            aria-label="Search HostelHub pages"
          />


          {search && (

            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => {

                setSearch("");

                setSearchOpen(
                  true
                );
              }}
              aria-label="Clear search"
            >
              ×
            </button>

          )}

        </form>


        {searchOpen && (

          <div className="topbar-search-suggestions">

            <div className="topbar-search-suggestions-header">

              <span>

                {search
                  ? "Matching pages"
                  : "Available pages"}

              </span>


              <small>
                {suggestions.length}
                {" "}
                {
                  suggestions.length ===
                  1
                    ? "result"
                    : "results"
                }
              </small>

            </div>


            {suggestions.length ===
            0 ? (

              <div className="topbar-search-empty">

                <span>
                  ⌕
                </span>

                <strong>
                  No page found
                </strong>

                <p>
                  Try another page name or keyword.
                </p>

              </div>

            ) : (

              <div className="topbar-search-results">

                {suggestions.map(
                  (
                    page
                  ) => (

                  <button
                    type="button"
                    key={
                      page.path
                    }
                    className="topbar-search-result"
                    onClick={() =>
                      openPage(
                        page.path
                      )
                    }
                  >

                    <span className="topbar-search-result-icon">
                      {page.icon}
                    </span>


                    <span className="topbar-search-result-info">

                      <strong>
                        {page.name}
                      </strong>

                      <small>
                        {page.description}
                      </small>

                    </span>


                    <span className="topbar-search-result-arrow">
                      →
                    </span>

                  </button>

                  )
                )}

              </div>

            )}


            {suggestions.length >
              0 && (

              <div className="topbar-search-tip">
                Press Enter to open the first result
              </div>

            )}

          </div>

        )}

      </div>


      {/* NOTIFICATION BELL ONLY */}

      <div className="hostel-topbar-actions">

        <div className="topbar-notification-wrapper">

          <button
            type="button"
            className="topbar-icon-button"
            onClick={() => {

              setNotificationOpen(
                (
                  previous
                ) =>
                  !previous
              );

              setSearchOpen(
                false
              );

            }}
            aria-label="Notifications"
          >

            🔔


            {unreadCount >
              0 && (

              <span className="topbar-notification-badge">

                {
                  unreadCount >
                  99
                    ? "99+"
                    : unreadCount
                }

              </span>

            )}

          </button>


          {notificationOpen && (

            <div className="topbar-notification-panel">

              <div className="topbar-panel-header">

                <div>

                  <strong>
                    Notifications
                  </strong>

                  <span>
                    {unreadCount}
                    {" "}
                    unread
                  </span>

                </div>


                {unreadCount >
                  0 && (

                  <button
                    type="button"
                    onClick={
                      markAllRead
                    }
                  >
                    Mark all read
                  </button>

                )}

              </div>


              <div className="topbar-notification-list">

                {notifications.length ===
                0 ? (

                  <div className="topbar-notification-empty">

                    <span>
                      🔔
                    </span>

                    <strong>
                      You're all caught up
                    </strong>

                    <p>
                      No notifications right now.
                    </p>

                  </div>

                ) : (

                  notifications.map(
                    (
                      notification
                    ) => (

                    <button
                      type="button"
                      key={
                        notification.id
                      }
                      className={
                        `topbar-notification-item ${
                          notification.is_read
                            ? ""
                            : "unread"
                        }`
                      }
                      onClick={() =>
                        openNotification(
                          notification
                        )
                      }
                    >

                      <span className="topbar-notification-icon">

                        {
                          notificationIcon(
                            notification.category
                          )
                        }

                      </span>


                      <span className="topbar-notification-content">

                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        <small>
                          {
                            notification.message
                          }
                        </small>

                        <em>
                          {
                            timeAgo(
                              notification.created_at
                            )
                          }
                        </em>

                      </span>


                      {!notification.is_read && (

                        <span className="topbar-unread-dot" />

                      )}

                    </button>

                    )
                  )

                )}

              </div>


              <button
                type="button"
                className="topbar-view-all"
                onClick={() => {

                  setNotificationOpen(
                    false
                  );

                  navigate(
                    "/notifications"
                  );

                }}
              >

                View all notifications

                <span>
                  →
                </span>

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}


export default Topbar;