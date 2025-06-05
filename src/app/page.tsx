"use client";

import { useEffect, useState } from "react";
import "./globals.css";

// Example gym location (latitude, longitude)
// Replace with your actual gym location coordinates
const GYM_LOCATION = { lat: 26.722222637907443, lng: 93.14560781021812 }; // Guwahati, Assam example
const GYM_RADIUS_METERS = 50; // Allow marking within 200 meters
const STATIC_CODE = "FirozLaude"; // Only this code can mark attendance

function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper for month names
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

// Restore the getMonthDays function
function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export default function Home() {
  const [canMark, setCanMark] = useState(false);
  const [attendance, setAttendance] = useState<{ [date: string]: boolean }>({});
  const [code, setCode] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [mounted, setMounted] = useState(false);

  // On mount, check if marking mode or spectator mode is set in localStorage
  useEffect(() => {
    const marking = localStorage.getItem("isMarkingMode");
    if (marking === "true") {
      setIsMarkingMode(true);
      setShowModeSelect(false);
    }
    const spectate = localStorage.getItem("isSpectatorMode");
    if (spectate === "true") {
      setIsSpectator(true);
      setShowModeSelect(false);
    }
    setMounted(true);
  }, []);

  // Replace localStorage attendance logic with API fetch/store
  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch("/api/attendance");
        const data = await res.json();
        setAttendance(data);
      } catch {
        // setError("Failed to fetch attendance from server.");
      }
    }
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (isSpectator || !isMarkingMode) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const dist = getDistanceFromLatLonInMeters(
            latitude,
            longitude,
            GYM_LOCATION.lat,
            GYM_LOCATION.lng
          );
          setCanMark(dist <= GYM_RADIUS_METERS);
        },
        () => {
          // setError("Location access denied or unavailable.");
        }
      );
    } else {
      // setError("Geolocation is not supported by this browser.");
    }
  }, [isSpectator, isMarkingMode]);

  async function handleMarkAttendance() {
    // setError("");
    if (!navigator.geolocation) {
      // setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          GYM_LOCATION.lat,
          GYM_LOCATION.lng
        );
        if (dist > GYM_RADIUS_METERS) {
          // setError("You are not at the gym location. Attendance not marked.");
          return;
        }
        try {
          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: todayStr })
          });
          if (res.ok) {
            setAttendance((prev) => ({ ...prev, [todayStr]: true }));
          } else {
            // setError("Failed to mark attendance.");
          }
        } catch {
          // setError("Failed to mark attendance.");
        }
      },
      () => {
        // setError("Location access denied or unavailable.");
      }
    );
  }

  function handleLogout() {
    setIsMarkingMode(false);
    setShowModeSelect(true);
    localStorage.removeItem("isMarkingMode");
    setCode("");
  }

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }
  function handleNextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const calendarDays = getMonthDays(calendarYear, calendarMonth);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 bg-cover bg-center" style={{ backgroundImage: 'url(/gym.png)' }}>
      <h1 className="text-3xl font-bold mb-4 font-mono">Firoz&apos;s Gym Attendance Tracker</h1>
      <p className="text-center text-gray-700 dark:text-gray-300 mb-4 font-mono">
        Firoz believes fat will vanish on its own. We&apos;re here to spy on his gym visits—and if he dares skip today, we&apos;ll blow the whistle (and maybe his snacks)!
      </p>
      <p className="text-center text-red-600 font-bold mb-4 font-mono">Firoz you can&apos;t hide</p>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full max-w-md flex flex-col items-center">
        {showModeSelect ? (
          <>
            <div className="w-full flex flex-col items-center mb-4">
              <input
                type="password"
                className="mb-2 px-2 py-1 border rounded w-full"
                placeholder="Enter static code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                className="mb-4 px-4 py-2 rounded bg-blue-600 text-white font-semibold"
                onClick={() => {
                  setIsSpectator(false);
                  setCodeError("");
                  if (code !== STATIC_CODE) {
                    setCodeError("Invalid code. Only the authorized person can mark attendance.");
                    return;
                  }
                  setIsMarkingMode(true);
                  setShowModeSelect(false);
                  localStorage.setItem("isMarkingMode", "true");
                  localStorage.removeItem("isSpectatorMode");
                }}
              >
                Roll Call: Firoz, Are You Hiding Again?
              </button>
              {codeError && <div className="text-sm text-red-500">{codeError}</div>}
            </div>
            <button
              className="px-4 py-2 rounded bg-gray-700 text-white font-semibold"
              onClick={() => {
                setIsSpectator(true);
                setShowModeSelect(false);
                localStorage.setItem("isSpectatorMode", "true");
                localStorage.removeItem("isMarkingMode");
              }}
            >
              Let&apos;s Spy on Firoz 👀
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 text-lg">
              {isSpectator ? "Spectator Mode" : "Today:"} {" "}
              {!isSpectator && <span className="font-mono">{todayStr}</span>}
            </div>
            {/* Calendar UI */}
            {mounted && (
              <div className="mb-6 w-full text-center">
                <div className="flex justify-between items-center mb-2">
                  <button onClick={handlePrevMonth} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm font-bold">&#8592;</button>
                  <span className="font-semibold text-base">
                    {mounted
                      ? `${MONTH_NAMES[calendarMonth]} ${calendarYear}`
                      : `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}`}
                  </span>
                  <button onClick={handleNextMonth} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm font-bold">&#8594;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs mb-1">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                    <div key={d} className="font-bold">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array(calendarDays[0].getDay()).fill(null).map((_, i) => (
                    <div key={"empty-"+i}></div>
                  ))}
                  {calendarDays.map((date: Date) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                    const marked = attendance[dateStr];
                    const isToday =
                      date.getFullYear() === today.getFullYear() &&
                      date.getMonth() === today.getMonth() &&
                      date.getDate() === today.getDate();
                    return (
                      <div
                        key={dateStr}
                        className={`w-8 h-8 flex items-center justify-center rounded-full border border-gray-300
                          ${marked ? "bg-green-400 text-white" : "bg-gray-100 dark:bg-gray-800"}
                          ${isToday ? (marked ? "ring-2 ring-yellow-300" : "ring-2 ring-blue-500") : ""}
                        `}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!isSpectator && isMarkingMode && (
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <button
                  className="flex-1 px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400 mb-0"
                  onClick={handleMarkAttendance}
                  disabled={
                    !canMark || attendance[todayStr] ||
                    calendarMonth !== today.getMonth() || calendarYear !== today.getFullYear()
                  }
                >
                  {attendance[todayStr] ? "Marked as Present" : "Mark Attendance"}
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded bg-red-600 text-white font-semibold mb-0"
                  onClick={handleLogout}
                >
                  Logout from Marking Mode
                </button>
              </div>
            )}
            {!isSpectator && !isMarkingMode && (
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <input
                  type="password"
                  className="flex-1 mb-2 sm:mb-0 px-2 py-1 border rounded"
                  placeholder="Enter static code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className="flex-1 px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400"
                  onClick={() => {
                    setIsSpectator(false);
                    setCodeError("");
                    if (code !== STATIC_CODE) {
                      setCodeError("Invalid code. Only the authorized person can mark attendance.");
                      return;
                    }
                    setIsMarkingMode(true);
                    setShowModeSelect(false);
                    localStorage.setItem("isMarkingMode", "true");
                    localStorage.removeItem("isSpectatorMode");
                  }}
                >
                  Enter Marking Mode
                </button>
              </div>
            )}
            {codeError && <div className="text-sm text-red-500 mt-2">{codeError}</div>}
            {isSpectator && (
              <div className="flex w-full mt-4">
                <button
                  className="flex-1 px-4 py-2 rounded bg-gray-700 text-white font-semibold"
                  onClick={() => { setShowModeSelect(true); setIsSpectator(false); localStorage.removeItem("isSpectatorMode"); }}
                >
                  Back to Mode Selection
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
