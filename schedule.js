
const STORAGE_KEY = "smartClassroomSchedules";

const defaultSchedules = [
  {id: 1, day:"Monday", start:"09:00", end:"10:00", subject:"Mathematics", teacher:"Dr. Sharma", room:"Room 101", className:"FY-BSc - Semester 1"},
  {id: 2, day:"Monday", start:"10:00", end:"11:00", subject:"Physics", teacher:"Prof. Patil", room:"Room 102", className:"FY-BSc - Semester 1"},
  {id: 3, day:"Tuesday", start:"09:00", end:"10:00", subject:"Physics", teacher:"Prof. Patil", room:"Room 102", className:"FY-BSc - Semester 1"},
  {id: 4, day:"Tuesday", start:"10:00", end:"11:00", subject:"English", teacher:"Dr. Mehta", room:"Room 103", className:"FY-BSc - Semester 1"},
  {id: 5, day:"Wednesday", start:"09:00", end:"10:00", subject:"English", teacher:"Dr. Mehta", room:"Room 103", className:"FY-BSc - Semester 1"},
  {id: 6, day:"Wednesday", start:"10:00", end:"11:00", subject:"Mathematics", teacher:"Dr. Sharma", room:"Room 101", className:"FY-BSc - Semester 1"},
  {id: 7, day:"Thursday", start:"09:00", end:"10:00", subject:"Chemistry", teacher:"Dr. Kulkarni", room:"Lab 202", className:"FY-BSc - Semester 1"},
  {id: 8, day:"Thursday", start:"10:00", end:"11:00", subject:"Computer Science", teacher:"Prof. Joshi", room:"Lab 201", className:"FY-BSc - Semester 1"},
  {id: 9, day:"Friday", start:"09:00", end:"10:00", subject:"Mathematics", teacher:"Dr. Sharma", room:"Room 101", className:"FY-BSc - Semester 1"},
  {id: 10, day:"Friday", start:"10:00", end:"11:00", subject:"Physics", teacher:"Prof. Patil", room:"Room 102", className:"FY-BSc - Semester 1"}
];

function getSchedules() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSchedules));
  return [...defaultSchedules];
}

function saveSchedules(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) &&
         timeToMinutes(bStart) < timeToMinutes(aEnd);
}

function subjectClass(subject) {
  const s = subject.toLowerCase();
  if (s.includes("math")) return "math";
  if (s.includes("physics")) return "physics";
  if (s.includes("english")) return "english";
  if (s.includes("chemistry")) return "chemistry";
  return "computer";
}

function showScheduleMessage(message, type = "error") {
  const box = document.getElementById("schedule-message");
  if (!box) return;
  box.textContent = message;
  box.className = `schedule-message ${type}`;
  box.hidden = false;
}

function renderTimetable() {
  const tbody = document.querySelector("#schedule-timetable-body");
  if (!tbody) return;

  const schedules = getSchedules();
  const selectedClass = document.getElementById("class-filter")?.value || "ALL";
  const selectedSemester = document.getElementById("semester-filter")?.value || "ALL";

  const filtered = schedules.filter(s =>
    (selectedClass === "ALL" || s.className.startsWith(selectedClass)) &&
    (selectedSemester === "ALL" || s.className.includes(selectedSemester))
  );

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = [
    ["09:00","10:00"],
    ["10:00","11:00"],
    ["11:00","12:00"],
    ["13:00","14:00"],
    ["14:00","15:00"]
  ];

  tbody.innerHTML = "";
  slots.forEach(([start,end]) => {
    const tr = document.createElement("tr");
    const time = document.createElement("td");
    time.innerHTML = `<strong>${formatTime(start)}–${formatTime(end)}</strong>`;
    tr.appendChild(time);

    days.forEach(day => {
      const td = document.createElement("td");
      const item = filtered.find(s =>
        s.day === day && timeToMinutes(s.start) === timeToMinutes(start)
      );

      if (item) {
        td.innerHTML = `
          <div class="subject ${subjectClass(item.subject)}">
            <strong>${escapeHtml(item.subject)}</strong>
            ${escapeHtml(item.teacher)}<br>
            ${escapeHtml(item.room)}
          </div>
        `;
      } else {
        td.innerHTML = `<span class="empty-slot">Free Period</span>`;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderScheduleList() {
  const list = document.getElementById("schedule-list");
  if (!list) return;

  const schedules = getSchedules().sort((a,b) =>
    ["Monday","Tuesday","Wednesday","Thursday","Friday"].indexOf(a.day) -
    ["Monday","Tuesday","Wednesday","Thursday","Friday"].indexOf(b.day) ||
    timeToMinutes(a.start) - timeToMinutes(b.start)
  );

  if (!schedules.length) {
    list.innerHTML = `<p class="empty-state">No classes scheduled.</p>`;
    return;
  }

  list.innerHTML = schedules.map(s => `
    <div class="scheduled-row">
      <div><strong>${escapeHtml(s.day)}</strong><small>${formatTime(s.start)}–${formatTime(s.end)}</small></div>
      <div><strong>${escapeHtml(s.subject)}</strong><small>${escapeHtml(s.teacher)} · ${escapeHtml(s.className)}</small></div>
      <div><strong>${escapeHtml(s.room)}</strong></div>
      <button class="btn danger delete-schedule" data-id="${s.id}">Delete</button>
    </div>
  `).join("");

  list.querySelectorAll(".delete-schedule").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const updated = getSchedules().filter(s => s.id !== id);
      saveSchedules(updated);
      renderScheduleList();
      renderTimetable();
      showScheduleMessage("Class removed successfully.", "success");
    });
  });
}

function initScheduleForm() {
  const form = document.getElementById("schedule-form");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.subject || !data.teacher || !data.room || !data.day ||
        !data.start || !data.end || !data.className) {
      showScheduleMessage("Please complete all required fields.");
      return;
    }

    if (timeToMinutes(data.start) >= timeToMinutes(data.end)) {
      showScheduleMessage("End time must be later than start time.");
      return;
    }

    if (timeToMinutes(data.start) < 7 * 60 || timeToMinutes(data.end) > 20 * 60) {
      showScheduleMessage("Please choose a time between 7:00 AM and 8:00 PM.");
      return;
    }

    const schedules = getSchedules();

    const roomConflict = schedules.find(s =>
      s.day === data.day && s.room === data.room &&
      overlaps(data.start, data.end, s.start, s.end)
    );
    if (roomConflict) {
      showScheduleMessage(
        `${data.room} is already booked on ${data.day} from ${formatTime(roomConflict.start)} to ${formatTime(roomConflict.end)}.`
      );
      return;
    }

    const teacherConflict = schedules.find(s =>
      s.day === data.day && s.teacher === data.teacher &&
      overlaps(data.start, data.end, s.start, s.end)
    );
    if (teacherConflict) {
      showScheduleMessage(
        `${data.teacher} already has a class on ${data.day} from ${formatTime(teacherConflict.start)} to ${formatTime(teacherConflict.end)}.`
      );
      return;
    }

    const classConflict = schedules.find(s =>
      s.day === data.day && s.className === data.className &&
      overlaps(data.start, data.end, s.start, s.end)
    );
    if (classConflict) {
      showScheduleMessage(
        `${data.className} already has a class on ${data.day} from ${formatTime(classConflict.start)} to ${formatTime(classConflict.end)}.`
      );
      return;
    }

    const newSchedule = {
      id: Date.now(),
      subject: data.subject,
      teacher: data.teacher,
      room: data.room,
      day: data.day,
      start: data.start,
      end: data.end,
      className: data.className
    };

    saveSchedules([...schedules, newSchedule]);
    form.reset();
    showScheduleMessage("Class scheduled successfully. The timetable has been updated.", "success");
    renderScheduleList();
    renderTimetable();
  });
}

function formatTime(value) {
  const [h,m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,"0")} ${suffix}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

document.addEventListener("DOMContentLoaded", () => {
  initScheduleForm();
  renderScheduleList();
  renderTimetable();

  document.getElementById("class-filter")?.addEventListener("change", renderTimetable);
  document.getElementById("semester-filter")?.addEventListener("change", renderTimetable);

  document.getElementById("reset-schedules")?.addEventListener("click", () => {
    if (confirm("Reset all schedules to the original demo timetable?")) {
      saveSchedules([...defaultSchedules]);
      renderScheduleList();
      renderTimetable();
      showScheduleMessage("Demo timetable restored.", "success");
    }
  });
});
